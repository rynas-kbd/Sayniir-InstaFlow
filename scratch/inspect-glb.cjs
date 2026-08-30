const fs = require('fs')

const filePath = 'public/models/iphone-16.glb'
const buffer = fs.readFileSync(filePath)

// GLB header: magic (4), version (4), length (4)
const magic = buffer.readUInt32LE(0)
const version = buffer.readUInt32LE(4)
const length = buffer.readUInt32LE(8)

console.log(`GLB Magic: 0x${magic.toString(16)} (expected 0x46546c67)`)
console.log(`Version: ${version}`)
console.log(`File Length: ${length} bytes`)

// Chunk 0: JSON header length (4), type (4)
const chunk0Length = buffer.readUInt32LE(12)
const chunk0Type = buffer.readUInt32LE(16) // 0x4e4f534a 'JSON'

const jsonBuffer = buffer.subarray(20, 20 + chunk0Length)
const jsonString = jsonBuffer.toString('utf8')
const gltfJson = JSON.parse(jsonString)

console.log('--- GLTF JSON SUMMARY ---')
console.log('Meshes count:', gltfJson.meshes?.length || 0)
console.log('Nodes count:', gltfJson.nodes?.length || 0)
console.log('Materials count:', gltfJson.materials?.length || 0)
console.log('Extensions used:', gltfJson.extensionsUsed || 'None')
console.log('Extensions required:', gltfJson.extensionsRequired || 'None')

if (gltfJson.nodes) {
  console.log('Node names:', gltfJson.nodes.map(n => n.name))
}
