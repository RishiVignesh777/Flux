extends Node
class_name PhysicsStateManager

# Physics State System for FLUX
# Manages state attributes: Mass, Gravity Scale, Friction, Restitution (Bounce), Magnetism, Phase Intangibility.

enum State {
	NORMAL,
	HEAVY,
	LIGHT,
	MAGNETIC,
	ELASTIC,
	FROZEN,
	PHASE
}

signal state_changed(old_state: State, new_state: State)

const STATE_PROPERTIES = {
	State.NORMAL: {
		"name": "Normal",
		"color": Color("#38bdf8"), # Sky blue
		"mass_multiplier": 1.0,
		"gravity_scale": 1.0,
		"move_speed": 220.0,
		"jump_velocity": -420.0,
		"friction": 0.85,
		"bounce": 0.0,
		"magnetic": false,
		"can_phase": false,
		"can_freeze_surfaces": false,
		"description": "Standard kinetic balance."
	},
	State.HEAVY: {
		"name": "Heavy",
		"color": Color("#f59e0b"), # Amber
		"mass_multiplier": 3.0,
		"gravity_scale": 2.2,
		"move_speed": 160.0,
		"jump_velocity": -290.0,
		"friction": 0.95,
		"bounce": 0.0,
		"magnetic": false,
		"can_phase": false,
		"can_freeze_surfaces": false,
		"description": "Crushes fragile barriers, triggers heavy pressure plates, resists air currents."
	},
	State.LIGHT: {
		"name": "Light",
		"color": Color("#ec4899"), # Neon Pink
		"mass_multiplier": 0.35,
		"gravity_scale": 0.45,
		"move_speed": 250.0,
		"jump_velocity": -520.0,
		"friction": 0.70,
		"bounce": 0.1,
		"magnetic": false,
		"can_phase": false,
		"can_freeze_surfaces": false,
		"description": "Low gravity glide, rides convection currents and wind updrafts."
	},
	State.MAGNETIC: {
		"name": "Magnetic",
		"color": Color("#a855f7"), # Purple
		"mass_multiplier": 1.0,
		"gravity_scale": 1.0,
		"move_speed": 220.0,
		"jump_velocity": -420.0,
		"friction": 0.85,
		"bounce": 0.0,
		"magnetic": true,
		"can_phase": false,
		"can_freeze_surfaces": false,
		"description": "Attracts/repels to polarized coils and adheres to magnetic ceilings/walls."
	},
	State.ELASTIC: {
		"name": "Elastic",
		"color": Color("#10b981"), # Emerald green
		"mass_multiplier": 0.9,
		"gravity_scale": 1.0,
		"move_speed": 240.0,
		"jump_velocity": -440.0,
		"friction": 0.65,
		"bounce": 0.85,
		"magnetic": false,
		"can_phase": false,
		"can_freeze_surfaces": false,
		"description": "Super-elastic restitution. Conserves and amplifies impact momentum."
	},
	State.FROZEN: {
		"name": "Frozen",
		"color": Color("#06b6d4"), # Cyan
		"mass_multiplier": 1.4,
		"gravity_scale": 1.1,
		"move_speed": 260.0,
		"jump_velocity": -400.0,
		"friction": 0.04, # Near zero friction
		"bounce": 0.05,
		"magnetic": false,
		"can_phase": false,
		"can_freeze_surfaces": true,
		"description": "Zero friction momentum slide, freezes water and fluid hazards."
	},
	State.PHASE: {
		"name": "Phase",
		"color": Color("#cbd5e1"), # Ghost silver / trans
		"mass_multiplier": 0.5,
		"gravity_scale": 0.7,
		"move_speed": 270.0,
		"jump_velocity": -460.0,
		"friction": 0.8,
		"bounce": 0.0,
		"magnetic": false,
		"can_phase": true,
		"can_freeze_surfaces": false,
		"description": "Quantum desynchronization. Passes through laser gates and phase barriers."
	}
}

var current_state: State = State.NORMAL

func get_state_prop(state: State, key: String, default_val = null):
	if STATE_PROPERTIES.has(state):
		return STATE_PROPERTIES[state].get(key, default_val)
	return default_val

func change_state(new_state: State) -> bool:
	if current_state == new_state:
		return false
	var old_state = current_state
	current_state = new_state
	state_changed.emit(old_state, new_state)
	return true
