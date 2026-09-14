// File: tests/test_package_manager.js
import { VirtualFileSystem } from '../js/vfs/vfs.js';
import { ModuleManager } from '../js/vm/modules.js';
import { PackageManager, POPULAR_REGISTRY } from '../js/packages/package_manager.js';

async function run() {
  console.log('--- Testing Package Manager ---');
  const vfs = new VirtualFileSystem();
  const mm = new ModuleManager(vfs);
  const pm = new PackageManager(mm);

  // 1. Initial list
  const initial = pm.listInstalled();
  console.log(`Initial installed packages: ${initial.length}`);
  if (!initial.some(p => p.name === 'math')) throw new Error('Missing math host bridge');
  if (!initial.some(p => p.name === 'requests')) throw new Error('Missing requests host bridge');
  if (!initial.some(p => p.name === 'statistics')) throw new Error('Missing statistics stdlib');

  // 2. Install colorsys from registry
  console.log('Installing colorsys...');
  const installRes = await pm.install('colorsys');
  if (!vfs.exists('/lib/python3/colorsys.py')) throw new Error('colorsys.py not found in VFS');
  if (!pm.isInstalled('colorsys')) throw new Error('pm.isInstalled(colorsys) returned false');
  console.log(`Installed colorsys in ${installRes.elapsed}ms (${installRes.size} bytes)`);

  // 3. Import and execute in UVM
  console.log('Loading colorsys module into UVM...');
  const colorsys = mm.getOrLoad('colorsys');
  if (typeof colorsys.rgb_to_hsv !== 'function') throw new Error('rgb_to_hsv function missing');
  const [h, s, v] = colorsys.rgb_to_hsv(1, 0, 0);
  console.log(`rgb_to_hsv(1, 0, 0) => [${h}, ${s}, ${v}]`);
  if (h !== 0 || s !== 1 || v !== 1) throw new Error('Invalid HSV conversion result');

  // 4. Install operator module
  console.log('Installing operator...');
  await pm.install('operator');
  const op = mm.getOrLoad('operator');
  if (typeof op.add !== 'function') throw new Error('op.add missing');
  if (op.add(10, 25) !== 35) throw new Error('op.add(10, 25) !== 35');
  console.log('operator.add(10, 25) =>', op.add(10, 25));

  // 5. Uninstall operator
  console.log('Uninstalling operator...');
  const uninstalled = pm.uninstall('operator');
  if (!uninstalled) throw new Error('uninstall returned false');
  if (vfs.exists('/lib/python3/operator.py')) throw new Error('operator still in VFS');
  if (pm.isInstalled('operator')) throw new Error('operator still reported as installed');

  // 6. Install cowsay (PyPI curated fallback)
  console.log('Installing cowsay...');
  const cowsayRes = await pm.install('cowsay');
  if (!vfs.exists('/lib/python3/cowsay.py')) throw new Error('cowsay.py not found in VFS');
  if (!pm.isInstalled('cowsay')) throw new Error('pm.isInstalled(cowsay) returned false');
  console.log(`Installed cowsay in ${cowsayRes.elapsed}ms from ${cowsayRes.origin}`);
  const cowsay = mm.getOrLoad('cowsay');
  if (typeof cowsay.cow !== 'function') throw new Error('cowsay.cow function missing');
  const art = cowsay.cow('Moo! Hello UVM!');
  if (!art.includes('^__^')) throw new Error('Invalid cow ascii art');
  console.log('Cowsay output verified:\n' + art);

  console.log('✅ ALL PACKAGE MANAGER INTEGRATION TESTS PASSED!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
