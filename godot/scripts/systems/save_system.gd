extends Node
class_name SaveManager

# Save System for FLUX
# Platform-independent local save system for Windows PC, Linux, and macOS.
# Persists:
# - Level completion
# - Best times
# - Death counts
# - Flux Shards
# - Challenge completion
# - Settings (Volume, Graphics, Colorblind)
# - Control bindings (Keyboard + Xbox/PS Controller remaps)

const SAVE_PATH = "user://flux_save_data.json"

var save_data: Dictionary = {
	"highest_unlocked_level": 1,
	"completed_levels": [],
	"level_stats": {}, # level_id: { "best_time": float, "deaths": int, "shards": int }
	"total_shards": 0,
	"collected_shards": [],
	"completed_challenges": [],
	"settings": {
		"master_volume": 0.9,
		"sfx_volume": 0.8,
		"music_volume": 0.5,
		"screen_shake": true,
		"particle_density": "FULL",
		"vsync": true,
		"target_fps": 60,
		"resolution_scale": 1.0,
		"colorblind_mode": false
	},
	"control_bindings": {
		"move_left": ["A", "Left Arrow", "Joypad D-pad Left"],
		"move_right": ["D", "Right Arrow", "Joypad D-pad Right"],
		"jump": ["Space", "W", "Joypad A / Cross"],
		"restart": ["R", "Joypad Y / Triangle"],
		"pause": ["Escape", "Joypad Menu / Options"],
		"state_heavy": ["1", "Joypad LB / L1"],
		"state_light": ["2", "Joypad RB / R1"],
		"state_magnetic": ["3", "Joypad X / Square"],
		"state_elastic": ["4", "Joypad B / Circle"],
		"state_frozen": ["5", "Joypad LT / L2"],
		"state_phase": ["6", "Joypad RT / R2"]
	}
}

func _ready() -> void:
	load_game()

func load_game() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		save_game()
		return

	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var text = file.get_as_text()
		var json = JSON.new()
		var parse_err = json.parse(text)
		if parse_err == OK and json.data is Dictionary:
			# Merge loaded data over defaults
			for key in json.data.keys():
				save_data[key] = json.data[key]
		file.close()

func save_game() -> void:
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		var json_string = JSON.stringify(save_data, "\t")
		file.store_string(json_string)
		file.close()

func record_level_clear(level_id: int, time_taken: float, deaths: int, shards: int) -> void:
	if not save_data["completed_levels"].has(level_id):
		save_data["completed_levels"].append(level_id)

	if level_id >= save_data["highest_unlocked_level"]:
		save_data["highest_unlocked_level"] = level_id + 1

	var str_id = str(level_id)
	var existing = save_data["level_stats"].get(str_id, {})
	var best_time = time_taken
	if existing.has("best_time"):
		best_time = min(existing["best_time"], time_taken)

	save_data["level_stats"][str_id] = {
		"best_time": best_time,
		"deaths": deaths,
		"shards": shards
	}
	save_game()

func is_level_unlocked(level_id: int) -> bool:
	return level_id <= save_data["highest_unlocked_level"]

func get_best_time(level_id: int) -> float:
	var str_id = str(level_id)
	if save_data["level_stats"].has(str_id):
		return save_data["level_stats"][str_id].get("best_time", 0.0)
	return 0.0
