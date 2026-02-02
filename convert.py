import bpy
import sys

# Get arguments after "--"
argv = sys.argv
if "--" in argv:
    argv = argv[argv.index("--") + 1:]
else:
    argv = []

if len(argv) < 2:
    print("Usage: blender -b -P convert.py -- input.usdz output.glb")
    sys.exit(1)

input_file = argv[0]
output_file = argv[1]

# Reset Blender
bpy.ops.wm.read_factory_settings(use_empty=True)

# Import USDZ (try both old and new Blender APIs)
try:
    # Try Blender 5.0+ API first
    bpy.ops.wm.usd_import(filepath=input_file)
    print("Used Blender 5.0+ API (wm.usd_import)")
except AttributeError:
    # Fall back to older Blender API
    try:
        bpy.ops.import_scene.usd(filepath=input_file)
        print("Used older Blender API (import_scene.usd)")
    except Exception as e:
        print(f"Error importing USD: {e}")
        sys.exit(1)
except Exception as e:
    print(f"Error importing USD: {e}")
    sys.exit(1)

# Export GLB
try:
    bpy.ops.export_scene.gltf(
        filepath=output_file,
        export_format='GLB'
    )
except Exception as e:
    print(f"Error exporting GLB: {e}")
    sys.exit(1)
