extends Node
class_name LevelManager

# Level System for FLUX
# Manages level loading, level sequences, star targets, and level data for the first 10 chambers.

signal level_loaded(level_id: int, level_data: Dictionary)
signal level_completed(level_id: int, stats: Dictionary)

var current_level_id: int = 1
var active_spawn_position: Vector2 = Vector2(100, 480)

# Built-in first 10 Campaign Chambers matching Development Priority
const LEVELS = {
	1: {
		"id": 1,
		"name": "Chamber 01: Awakening",
		"par_time": 8.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL],
		"player_spawn": Vector2(120, 480),
		"exit_door": Vector2(800, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60}, # Floor
			{"x": 40, "y": 60, "w": 40, "h": 500}, # Left wall
			{"x": 880, "y": 60, "w": 40, "h": 500} # Right wall
		],
		"shards": [{"x": 460, "y": 420, "id": 1}],
		"hazards": []
	},
	2: {
		"id": 2,
		"name": "Chamber 02: Mass Impact",
		"par_time": 10.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.HEAVY],
		"player_spawn": Vector2(120, 480),
		"exit_door": Vector2(820, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60},
			{"x": 460, "y": 380, "w": 40, "h": 140}
		],
		"shards": [{"x": 460, "y": 320, "id": 1}],
		"hazards": []
	},
	3: {
		"id": 3,
		"name": "Chamber 03: Buoyant Drift",
		"par_time": 12.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.LIGHT],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 260, "h": 60},
			{"x": 640, "y": 520, "w": 260, "h": 60}
		],
		"shards": [{"x": 470, "y": 360, "id": 1}],
		"hazards": [{"x": 320, "y": 540, "w": 320, "h": 40, "type": "SPIKES"}]
	},
	4: {
		"id": 4,
		"name": "Chamber 04: Magnetic Rail",
		"par_time": 14.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.MAGNETIC],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 200, "h": 60},
			{"x": 700, "y": 520, "w": 200, "h": 60},
			{"x": 260, "y": 200, "w": 440, "h": 30} # Magnetic ceiling
		],
		"shards": [{"x": 480, "y": 240, "id": 1}],
		"hazards": [{"x": 260, "y": 540, "w": 440, "h": 40, "type": "SPIKES"}]
	},
	5: {
		"id": 5,
		"name": "Chamber 05: Kinetic Rebound",
		"par_time": 11.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.ELASTIC],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60},
			{"x": 450, "y": 260, "w": 40, "h": 260} # High barrier requiring elastic high bounce
		],
		"shards": [{"x": 470, "y": 180, "id": 1}],
		"hazards": []
	},
	6: {
		"id": 6,
		"name": "Chamber 06: Zero Friction",
		"par_time": 13.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.FROZEN],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60},
			{"x": 380, "y": 420, "w": 180, "h": 40} # Low tunnel
		],
		"shards": [{"x": 470, "y": 480, "id": 1}],
		"hazards": []
	},
	7: {
		"id": 7,
		"name": "Chamber 07: Quantum Phase",
		"par_time": 15.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.PHASE],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60}
		],
		"shards": [{"x": 470, "y": 460, "id": 1}],
		"hazards": [{"x": 460, "y": 200, "w": 20, "h": 320, "type": "LASER"}]
	},
	8: {
		"id": 8,
		"name": "Chamber 08: Polarity Inversion",
		"par_time": 14.0,
		"allowed_states": [PhysicsStateManager.State.NORMAL, PhysicsStateManager.State.HEAVY],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 160),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60},
			{"x": 60, "y": 100, "w": 840, "h": 40}
		],
		"shards": [{"x": 480, "y": 300, "id": 1}],
		"hazards": []
	},
	9: {
		"id": 9,
		"name": "Chamber 09: State Symphony",
		"par_time": 18.0,
		"allowed_states": [
			PhysicsStateManager.State.NORMAL,
			PhysicsStateManager.State.HEAVY,
			PhysicsStateManager.State.LIGHT,
			PhysicsStateManager.State.ELASTIC
		],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60}
		],
		"shards": [{"x": 470, "y": 340, "id": 1}],
		"hazards": [{"x": 300, "y": 530, "w": 200, "h": 30, "type": "SPIKES"}]
	},
	10: {
		"id": 10,
		"name": "Chamber 10: Flux Mastery",
		"par_time": 22.0,
		"allowed_states": [
			PhysicsStateManager.State.NORMAL,
			PhysicsStateManager.State.HEAVY,
			PhysicsStateManager.State.LIGHT,
			PhysicsStateManager.State.MAGNETIC,
			PhysicsStateManager.State.ELASTIC,
			PhysicsStateManager.State.FROZEN,
			PhysicsStateManager.State.PHASE
		],
		"player_spawn": Vector2(100, 480),
		"exit_door": Vector2(840, 480),
		"blocks": [
			{"x": 60, "y": 520, "w": 840, "h": 60}
		],
		"shards": [{"x": 480, "y": 280, "id": 1}],
		"hazards": [{"x": 400, "y": 220, "w": 20, "h": 300, "type": "LASER"}]
	}
}

func get_current_spawn_position() -> Vector2:
	return active_spawn_position

func load_level(level_id: int) -> Dictionary:
	current_level_id = level_id
	var data = LEVELS.get(level_id, LEVELS[1])
	active_spawn_position = data.get("player_spawn", Vector2(100, 480))
	level_loaded.emit(level_id, data)
	return data
