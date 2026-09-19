extends CharacterBody2D
class_name PlayerController

# Player Controller for FLUX
# 60 FPS precise PC platformer character controller with full Xbox & PlayStation gamepad support,
# Coyote time, Jump buffering, State switching, Squash/Stretch, and Modular Physics integration.

signal state_switched(new_state: int)
signal player_died()
signal player_reached_exit()

@export var base_speed: float = 220.0
@export var base_jump_impulse: float = -420.0
@export var acceleration: float = 1400.0
@export var friction: float = 1200.0
@export var coyote_time_max: float = 0.12
@export var jump_buffer_max: float = 0.10

# Timers
var coyote_timer: float = 0.0
var jump_buffer_timer: float = 0.0

# Current State
var current_state: int = PhysicsStateManager.State.NORMAL
var is_dead: bool = false
var has_reached_exit: bool = false
var facing_direction: int = 1

# Magnetism
var is_attached_to_magnet: bool = false
var magnet_surface_normal: Vector2 = Vector2.ZERO

# Visual Nodes
@onready var sprite: ColorRect = $Visuals/ColorRect
@onready var aura: ColorRect = $Visuals/Aura
@onready var collision_shape: CollisionShape2D = $CollisionShape2D

# Visual Squash & Stretch
var squash_scale: Vector2 = Vector2.ONE

func _ready() -> void:
	if PhysicsStateManager:
		PhysicsStateManager.state_changed.connect(_on_state_changed)
	apply_state_visuals(current_state)

func _physics_process(delta: float) -> void:
	if is_dead or has_reached_exit:
		return

	_handle_input_state_switching()
	_update_coyote_and_buffer(delta)
	_apply_gravity(delta)
	_handle_movement(delta)
	_handle_jump()
	_handle_magnetism(delta)

	# Godot 4 standard CharacterBody2D movement
	up_direction = GravitySystem.get_up_vector() if GravitySystem else Vector2.UP
	var was_on_floor = is_on_floor()
	move_and_slide()

	# Landing detection for squash animation and audio
	if not was_on_floor and is_on_floor():
		_on_landed()

	# Handle Elastic Bounces
	if current_state == PhysicsStateManager.State.ELASTIC and get_slide_collision_count() > 0:
		_process_elastic_bounce()

	_update_visuals(delta)

func _update_coyote_and_buffer(delta: float) -> void:
	if is_on_floor():
		coyote_timer = coyote_time_max
	else:
		coyote_timer = max(0.0, coyote_timer - delta)

	if Input.is_action_just_pressed("jump"):
		jump_buffer_timer = jump_buffer_max
	else:
		jump_buffer_timer = max(0.0, jump_buffer_timer - delta)

func _apply_gravity(delta: float) -> void:
	if is_attached_to_magnet:
		velocity = Vector2.ZERO
		return

	var grav_vec = GravitySystem.get_gravity_vector() if GravitySystem else Vector2(0, 980.0)
	var grav_scale = PhysicsStateManager.get_state_prop(current_state, "gravity_scale", 1.0) if PhysicsStateManager else 1.0
	velocity += grav_vec * grav_scale * delta

func _handle_movement(delta: float) -> void:
	# Continuous action axis handling (Works with Keyboard A/D and Controller Left Stick / D-pad)
	var input_axis = Input.get_axis("move_left", "move_right")

	if input_axis != 0:
		facing_direction = 1 if input_axis > 0 else -1

	var target_speed = PhysicsStateManager.get_state_prop(current_state, "move_speed", base_speed) if PhysicsStateManager else base_speed
	var state_friction_mult = PhysicsStateManager.get_state_prop(current_state, "friction", 0.85) if PhysicsStateManager else 0.85

	# Frozen state has ultra-low friction (ice slide)
	var effective_friction = friction * state_friction_mult
	var effective_accel = acceleration * (0.4 if current_state == PhysicsStateManager.State.FROZEN else 1.0)

	if input_axis != 0:
		velocity.x = move_toward(velocity.x, input_axis * target_speed, effective_accel * delta)
	else:
		velocity.x = move_toward(velocity.x, 0.0, effective_friction * delta)

func _handle_jump() -> void:
	if jump_buffer_timer > 0.0 and (coyote_timer > 0.0 or is_attached_to_magnet):
		jump_buffer_timer = 0.0
		coyote_timer = 0.0
		is_attached_to_magnet = false

		var jump_imp = PhysicsStateManager.get_state_prop(current_state, "jump_velocity", base_jump_impulse) if PhysicsStateManager else base_jump_impulse
		var up_dir = GravitySystem.get_up_vector() if GravitySystem else Vector2.UP
		velocity = -up_dir * jump_imp

		# Visual stretch
		squash_scale = Vector2(0.75, 1.35)

		# Sound & Controller Rumble
		if SoundManager:
			SoundManager.play_jump()
		Input.start_joy_vibration(0, 0.2, 0.1, 0.08)

	# Variable jump height cut
	if Input.is_action_just_released("jump") and velocity.y < 0:
		velocity.y *= 0.55

func _handle_magnetism(_delta: float) -> void:
	if current_state != PhysicsStateManager.State.MAGNETIC:
		is_attached_to_magnet = false

func _handle_input_state_switching() -> void:
	if Input.is_action_just_pressed("state_heavy"):
		switch_to_state(PhysicsStateManager.State.HEAVY)
	elif Input.is_action_just_pressed("state_light"):
		switch_to_state(PhysicsStateManager.State.LIGHT)
	elif Input.is_action_just_pressed("state_magnetic"):
		switch_to_state(PhysicsStateManager.State.MAGNETIC)
	elif Input.is_action_just_pressed("state_elastic"):
		switch_to_state(PhysicsStateManager.State.ELASTIC)
	elif Input.is_action_just_pressed("state_frozen"):
		switch_to_state(PhysicsStateManager.State.FROZEN)
	elif Input.is_action_just_pressed("state_phase"):
		switch_to_state(PhysicsStateManager.State.PHASE)
	elif Input.is_action_just_pressed("restart"):
		respawn()

func switch_to_state(target_state: int) -> void:
	if current_state == target_state:
		return
	var old_state = current_state
	current_state = target_state
	velocity = MomentumSystem.preserve_state_switch_momentum(velocity, old_state, new_state)
	apply_state_visuals(current_state)
	state_switched.emit(current_state)

	if SoundManager:
		SoundManager.play_state_switch(current_state)
	Input.start_joy_vibration(0, 0.35, 0.35, 0.12)

func _on_state_changed(_old_state: int, new_state: int) -> void:
	current_state = new_state
	apply_state_visuals(current_state)

func apply_state_visuals(state: int) -> void:
	var color = PhysicsStateManager.get_state_prop(state, "color", Color("#38bdf8")) if PhysicsStateManager else Color("#38bdf8")
	if sprite:
		sprite.color = color
	if aura:
		aura.color = Color(color.r, color.g, color.b, 0.25)

func _process_elastic_bounce() -> void:
	for i in range(get_slide_collision_count()):
		var collision = get_slide_collision(i)
		var normal = collision.get_normal()
		if velocity.length() > 80.0:
			velocity = MomentumSystem.calculate_elastic_bounce(velocity, normal, 0.88)
			squash_scale = Vector2(1.3, 0.7)
			if SoundManager:
				SoundManager.play_bounce()
			Input.start_joy_vibration(0, 0.4, 0.2, 0.1)
			break

func _on_landed() -> void:
	squash_scale = Vector2(1.35, 0.7)
	if SoundManager:
		SoundManager.play_land()

func _update_visuals(delta: float) -> void:
	# Smoothly interpolate squash and stretch back to Vector2.ONE
	squash_scale = squash_scale.lerp(Vector2.ONE, delta * 12.0)
	if $Visuals:
		$Visuals.scale = squash_scale

func die() -> void:
	if is_dead:
		return
	is_dead = true
	velocity = Vector2.ZERO
	player_died.emit()
	if SoundManager:
		SoundManager.play_death()
	Input.start_joy_vibration(0, 0.8, 0.8, 0.3)

	# Quick respawn
	await get_tree().create_timer(0.35).timeout
	respawn()

func respawn() -> void:
	is_dead = false
	velocity = Vector2.ZERO
	current_state = PhysicsStateManager.State.NORMAL
	apply_state_visuals(current_state)
	if LevelManager:
		global_position = LevelManager.get_current_spawn_position()

func reach_exit() -> void:
	if has_reached_exit:
		return
	has_reached_exit = true
	velocity = Vector2.ZERO
	player_reached_exit.emit()
	if SoundManager:
		SoundManager.play_win()
	Input.start_joy_vibration(0, 0.5, 0.5, 0.25)
