import os
import json

def generate_manifest():
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    manifest = {}

    if not os.path.exists(data_dir):
        print(f"Error: Data directory '{data_dir}' not found.")
        return

    # Walk through the data directory
    for item in os.listdir(data_dir):
        item_path = os.path.join(data_dir, item)
        
        # Only process directories (excluding hidden ones)
        if os.path.isdir(item_path) and not item.startswith('.'):
            # List all JSON files in the subdirectory
            json_files = [f for f in os.listdir(item_path) if f.endswith('.json') and not f.startswith('.')]
            if json_files:
                manifest[item] = json_files

    # Write to manifest.json
    manifest_path = os.path.join(data_dir, 'manifest.json')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=4)
        
    print(f"Successfully generated manifest.json at '{manifest_path}'")
    print(f"Found {len(manifest)} folders.")

if __name__ == "__main__":
    generate_manifest()
