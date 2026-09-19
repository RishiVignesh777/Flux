extends Node2D
class_name LevelEditor

# Level Editor for FLUX
# In-engine grid-based level creation tool with interactive placement, testing, and JSON import/export.

enum ToolMode {
	SOLID_BLOCK,
	HAZARD_SPIKE,
	HAZARD_LASER,
	MAGNETIC_RAIL,
	GRAVITY_SWITCH,
	PRESSURE_PLATE,
	FLUX_SHARD,
	PLAYER_SPAWN,
	EXIT_PORTAL,
	ERASE
}

var current_tool: ToolMode = ToolMode.SOLID_BLOCK
var grid_size: int = 40
var level_name: String = "Custom Chamber"

var custom_level_data: Dictionary = {
	"name": "Custom Chamber",
	"par_time": 15.0,
	"player_spawn": Vector2(100, 480),
	"exit_door": Vector2(800, 480),
	"blocks": [],
	"hazards": [],
	"shards": []
}

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		var grid_pos = (get_global_mouse_position() / float(grid_size)).floor() * grid_size
		if event.button_index == MOUSE_BUTTON_LEFT:
			_place_object(grid_pos)
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			_erase_object(grid_pos)

func _place_object(pos: Vector2) -> void:
	match current_tool:
		ToolMode.SOLID_BLOCK:
			custom_level_data["blocks"].append({"x": pos.x, "y": pos.y, "w": grid_size, "h": grid_size})
		ToolMode.HAZARD_SPIKE:
			custom_level_data["hazards"].append({"x": pos.x, "y": pos.y, "w": grid_size, "h": 20, "type": "SPIKES"})
		ToolMode.HAZARD_LASER:
			custom_level_data["hazards"].append({"x": pos.x, "y": pos.y, "w": 16, "h": grid_size * 3, "type": "LASER"})
		ToolMode.FLUX_SHARD:
			custom_level_data["shards"].append({"x": pos.x, "y": pos.y, "id": custom_level_data["shards"].size() + 1})
		ToolMode.PLAYER_SPAWN:
			custom_level_data["player_spawn"] = pos
		ToolMode.EXIT_PORTAL:
			custom_level_data["exit_door"] = pos
	queue_redraw()

func _erase_object(pos: Vector2) -> void:
	# Remove any block at grid position
	var filtered_blocks = []
	for b in custom_level_data["blocks"]:
		if not (b["x"] == pos.x and b["y"] == pos.y):
			filtered_blocks.append(b)
	custom_level_data["blocks"] = filtered_blocks
	queue_redraw()

func export_level_json() -> String:
	return JSON.stringify(custom_level_data, "\t")

func load_level_json(json_text: String) -> bool:
	var json = JSON.new()
	if json.parse(json_text) == OK and json.data is Dictionary:
		custom_level_data = json.data
		queue_redraw()
		return true
	return false
