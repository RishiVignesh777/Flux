extends Node2D
class_name HazardSystem

# Hazard System for FLUX
# Handles lethal hazards:
# - Spikes (always lethal unless Phase or Frozen over)
# - Laser Beams (lethal to all except Phase state)
# - Disintegration Void Zones (screen boundaries or acid pools)

enum HazardType {
	SPIKES,
	LASER,
	VOID,
	CRUSHER
}

class HazardArea extends Area2D:
	@export var hazard_type: HazardType = HazardType.SPIKES

	func _ready() -> void:
		body_entered.connect(_on_body_entered)

	func _on_body_entered(body: Node2D) -> void:
		if body is PlayerController:
			# Check immunities based on Physics State
			if hazard_type == HazardType.LASER and body.current_state == PhysicsStateManager.State.PHASE:
				return # Phase safely desynchronizes through laser fields

			if hazard_type == HazardType.SPIKES and body.current_state == PhysicsStateManager.State.PHASE:
				return

			# Otherwise lethal impact
			body.die()
