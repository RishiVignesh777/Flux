extends Node
class_name GravitySystem

# Gravity System for FLUX
# Handles directional gravity manipulation (Down, Up, Left, Right) and coordinate transforms.

enum Direction {
	DOWN,
	UP,
	LEFT,
	RIGHT
}

signal gravity_changed(new_direction: Direction, gravity_vector: Vector2)

var current_direction: Direction = Direction.DOWN
var gravity_magnitude: float = 980.0

func set_gravity_direction(new_dir: Direction) -> void:
	if current_direction == new_dir:
		return
	current_direction = new_dir
	var vec = get_gravity_vector()
	gravity_changed.emit(current_direction, vec)

func get_gravity_vector() -> Vector2:
	match current_direction:
		Direction.DOWN:
			return Vector2(0, gravity_magnitude)
		Direction.UP:
			return Vector2(0, -gravity_magnitude)
		Direction.LEFT:
			return Vector2(-gravity_magnitude, 0)
		Direction.RIGHT:
			return Vector2(gravity_magnitude, 0)
	return Vector2(0, gravity_magnitude)

func get_up_vector() -> Vector2:
	return -get_gravity_vector().normalized()

func rotate_clockwise() -> void:
	match current_direction:
		Direction.DOWN: set_gravity_direction(Direction.LEFT)
		Direction.LEFT: set_gravity_direction(Direction.UP)
		Direction.UP: set_gravity_direction(Direction.RIGHT)
		Direction.RIGHT: set_gravity_direction(Direction.DOWN)

func rotate_counter_clockwise() -> void:
	match current_direction:
		Direction.DOWN: set_gravity_direction(Direction.RIGHT)
		Direction.RIGHT: set_gravity_direction(Direction.UP)
		Direction.UP: set_gravity_direction(Direction.LEFT)
		Direction.LEFT: set_gravity_direction(Direction.DOWN)
