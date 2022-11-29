import { rmDist, chProjectDir, copyPackageFiles, tsc } from 'lionconfig'

chProjectDir(import.meta.url)
rmDist()
await tsc()
await copyPackageFiles()

