extends Node
class_name MomentumSystem

# Momentum System for FLUX
# Handles conservation of kinetic energy across state transitions, launch trajectories, and surface impacts.

signal momentum_boosted(original_velocity: Vector2, new_velocity: Vector2)

# Multipliers applied when transitioning states mid-flight
const TRANSITION_MOMENTUM_FACTORS = {
	# Transitioning from Frozen into Elastic preserves full lateral speed into bounce
	"frozen_to_elastic": 1.15,
	# Transitioning from Light into Heavy amplifies downward kinetic slam
	"light_to_heavy_fall": 1.4,
	# Phase dash kinetic exit boost
	"phase_exit": 1.25
}

static func calculate_elastic_bounce(incoming_velocity: Vector2, surface_normal: Vector2, restitution: float = 0.85) -> Vector2:
	# Standard physics reflection with restitution
	var reflected = incoming_velocity.bounce(surface_normal)
	return reflected * restitution

static func calculate_launch_impulse(base_force: float, player_mass_multiplier: float, launch_direction: Vector2) -> Vector2:
	# Newton's Second Law: a = F / m
	var effective_impulse = base_force / max(0.2, player_mass_multiplier)
	return launch_direction.normalized() * effective_impulse

static func preserve_state_switch_momentum(velocity: Vector2, old_state: int, new_state: int) -> Vector2:
	var result = velocity
	if old_state == PhysicsStateManager.State.FROZEN and new_state == PhysicsStateManager.State.ELASTIC:
		result.x *= TRANSITION_MOMENTUM_FACTORS["frozen_to_elastic"]
	elif old_state == PhysicsStateManager.State.LIGHT and new_state == PhysicsStateManager.State.HEAVY:
		if result.y > 0:
			result.y *= TRANSITION_MOMENTUM_FACTORS["light_to_heavy_fall"]
	return result
