// File: js/vm/scheduler.js
const queueNextFrame =
  typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame
    : (cb) => setTimeout(cb, 16);

export class Scheduler {
  constructor(interpreter = null) {
    this.interpreter = interpreter;
    this.fibers = [];
    this.nextFiberId = 1;
    this.macroTasks = [];
    this.microTasks = [];
    this.isRunning = false;
    this.stopRequested = false;
    this.onComplete = null;
    this.onError = null;
    this.onInputRequired = null;
    this.onConsoleSync = null;
    this.rootError = null;
  }

  spawn(generator, parent = null) {
    const fiber = {
      id: this.nextFiberId++,
      generator: generator,
      status: "ready", // "ready", "running", "sleeping", "suspended_for_input", "suspended_on_join", "completed", "failed"
      wakeTime: 0,
      parent: parent,
      currentStep: null,
      error: null,
      result: null,
      joiners: [],
    };
    this.fibers.push(fiber);
    return fiber;
  }

  queueMacroTask(callback, args = [], delay = 0) {
    this.macroTasks.push({
      callback,
      args,
      time: performance.now() + delay,
    });
  }

  queueMicroTask(callback) {
    this.microTasks.push(callback);
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      this.loop();
    }
  }

  stop() {
    this.stopRequested = true;
    this.isRunning = false;
    this.isPaused = false;
    this.rootError = null;
    this.fibers = [];
    this.macroTasks = [];
    this.microTasks = [];
  }

  run(onComplete, onError) {
    this.onComplete = onComplete;
    this.onError = onError;
    this.isRunning = true;
    this.isPaused = false;
    this.stopRequested = false;
    this.rootError = null;
    this.loop();
  }

  loop() {
    if (!this.isRunning || this.stopRequested || this.isPaused) return;

    try {
      const sliceStart = performance.now();

      // Process Microtasks first
      while (
        this.microTasks.length > 0 &&
        performance.now() - sliceStart < 16
      ) {
        const task = this.microTasks.shift();
        task();
      }

      // Run active fibers
      let hasActiveFibers = true;
      while (hasActiveFibers && performance.now() - sliceStart < 16) {
        let activeFibers = this.fibers.filter(
          (f) =>
            f.status === "ready" ||
            f.status === "running" ||
            (f.status === "sleeping" && performance.now() >= f.wakeTime),
        );

        if (activeFibers.length === 0) {
          hasActiveFibers = false;
          break;
        }

        for (let fiber of activeFibers) {
          if (performance.now() - sliceStart >= 16) break;

          if (fiber.status === "sleeping") {
            fiber.status = "ready";
          }

          fiber.status = "running";
          try {
            let step = fiber.currentStep;
            fiber.currentStep = null; // consume it

            if (!step) {
              step = fiber.generator.next();
            }

            if (step.done) {
              fiber.status = "completed";
              fiber.result = step.value;
              this.resolveFiber(fiber);
            } else {
              const cmd = step.value;
              if (cmd && typeof cmd === "object") {
                if (cmd.type === "SUSPEND_FOR_INPUT") {
                  fiber.status = "suspended_for_input";
                  fiber.currentStep = step; // preserve this step
                  if (this.onInputRequired) {
                    this.onInputRequired(cmd.prompt, (userInput) => {
                      fiber.status = "ready";
                      // Pass input back to fiber
                      fiber.currentStep = fiber.generator.next(userInput);
                      // schedule loop immediately
                      setTimeout(() => this.loop(), 0);
                    });
                  }
                  break; // yield current slice
                } else if (cmd.type === "ASYNC_PROMISE") {
                  fiber.status = "suspended_for_async";
                  cmd.promise
                    .then((resolvedVal) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.next(resolvedVal);
                      setTimeout(() => this.loop(), 0);
                    })
                    .catch((err) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.throw(err);
                      setTimeout(() => this.loop(), 0);
                    });
                  break;
                } else if (cmd.type === "ASYNC_IMPORT") {
                  fiber.status = "suspended_for_async";
                  const callerVm = cmd.vm || fiber.vm || (this.interpreter && this.interpreter.vm) || null;
                  const mm =
                    (callerVm && callerVm.moduleManager) ||
                    (this.interpreter && this.interpreter.moduleManager) ||
                    null;
                  if (!mm || typeof mm.fetchAndCacheModule !== "function") {
                    fiber.status = "ready";
                    fiber.currentStep = fiber.generator.throw(
                      new Error(
                        `ImportError: Dynamic module fetcher unavailable for '${cmd.moduleName}'`,
                      ),
                    );
                    break;
                  }
                  mm.fetchAndCacheModule(cmd.moduleName, callerVm)
                    .then((mod) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.next(mod);
                      setTimeout(() => this.loop(), 0);
                    })
                    .catch((err) => {
                      fiber.status = "ready";
                      fiber.currentStep = fiber.generator.throw(err);
                      setTimeout(() => this.loop(), 0);
                    });
                  break;
                } else if (cmd.type === "SLEEP") {
                  fiber.status = "sleeping";
                  fiber.wakeTime = performance.now() + cmd.duration;
                } else if (cmd.type === "SPAWN") {
                  const newFiber = this.spawn(cmd.generator, fiber);
                  // resume current fiber with new fiber instance
                  fiber.currentStep = fiber.generator.next(newFiber);
                  fiber.status = "ready";
                } else if (cmd.type === "JOIN") {
                  const target = cmd.target;
                  if (
                    target.status === "completed" ||
                    target.status === "failed"
                  ) {
                    if (target.status === "failed") {
                      fiber.currentStep = fiber.generator.throw(target.error);
                    } else {
                      fiber.currentStep = fiber.generator.next(target.result);
                    }
                    fiber.status = "ready";
                  } else {
                    fiber.status = "suspended_on_join";
                    target.joiners.push(fiber);
                  }
                } else if (cmd.type === "YIELD") {
                  fiber.status = "ready";
                } else {
                  // Not a command, resume fiber passing step value back
                  fiber.currentStep = fiber.generator.next(cmd);
                  fiber.status = "ready";
                }
              } else {
                // Primitive step value, resume
                fiber.currentStep = fiber.generator.next(cmd);
                fiber.status = "ready";
              }
            }
          } catch (err) {
            fiber.status = "failed";
            fiber.error = err;
            this.rejectFiber(fiber, err);
          }
        }
      }

      // Flush console buffer to UI
      if (this.onConsoleSync) {
        this.onConsoleSync();
      }

      // Remove dead fibers
      this.fibers = this.fibers.filter(
        (f) => f.status !== "completed" && f.status !== "failed",
      );

      const ongoingFibers = this.fibers.length > 0;

      // Trigger macrotasks if event queue is empty
      if (!ongoingFibers) {
        const now = performance.now();
        const dueTasks = this.macroTasks.filter((t) => t.time <= now);
        if (dueTasks.length > 0) {
          this.macroTasks = this.macroTasks.filter((t) => t.time > now);
          for (let task of dueTasks) {
            const fiberGen = task.callback(...task.args);
            if (fiberGen && typeof fiberGen.next === "function") {
              this.spawn(fiberGen);
            }
          }
          queueNextFrame(() => this.loop());
          return;
        }
      }

      if (this.fibers.length > 0 || this.microTasks.length > 0) {
        queueNextFrame(() => this.loop());
      } else if (this.macroTasks.length > 0) {
        const nextTask = this.macroTasks.reduce(
          (min, t) => (t.time < min.time ? t : min),
          this.macroTasks[0],
        );
        const delay = Math.max(0, nextTask.time - performance.now());
        setTimeout(() => this.loop(), delay);
      } else {
        this.isRunning = false;
        if (this.rootError) {
          const err = this.rootError;
          this.rootError = null;
          if (this.onError) {
            this.onError(err);
            return;
          }
        }
        if (this.onComplete) {
          this.onComplete();
        }
      }
    } catch (err) {
      this.isRunning = false;
      if (this.onError) {
        this.onError(err);
      }
    }
  }

  resolveFiber(fiber) {
    for (let joiner of fiber.joiners) {
      joiner.status = "ready";
      joiner.currentStep = joiner.generator.next(fiber.result);
    }
    fiber.joiners = [];
  }

  rejectFiber(fiber, err) {
    let handled = false;
    // propagate to joiners
    for (let joiner of fiber.joiners) {
      joiner.status = "ready";
      try {
        joiner.currentStep = joiner.generator.throw(err);
        handled = true;
      } catch (innerErr) {
        // If joiner fails, its rejectFiber will handle it recursively
        this.rejectFiber(joiner, innerErr);
        handled = true;
      }
    }
    fiber.joiners = [];

    // propagate to parent
    if (
      fiber.parent &&
      (fiber.parent.status === "suspended_on_join" ||
        fiber.parent.status === "running" ||
        fiber.parent.status === "ready")
    ) {
      fiber.parent.status = "ready";
      try {
        fiber.parent.currentStep = fiber.parent.generator.throw(err);
        handled = true;
      } catch (innerErr) {
        this.rejectFiber(fiber.parent, innerErr);
        handled = true;
      }
    }

    if (!handled) {
      if (fiber.id === 1 || !fiber.parent) {
        this.rootError = err;
      }
      // Thread Isolation: Log the unhandled thread exception but let other fibers continue running!
      console.error(
        `[Scheduler] Unhandled exception in background Fiber #${fiber.id}:`,
      );
      console.error(err.stack || err.message || err);

      // Append the error stack directly to the console outputs of the interpreter if available
      if (this.interpreter && typeof this.interpreter.log === "function") {
        this.interpreter.log(
          `\n[!] Unhandled exception in background thread (Fiber #${fiber.id}): ${err.message}`,
        );
      }
    }
  }
}
