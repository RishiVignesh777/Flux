extends CanvasLayer
class_name UISystem

# UI System for FLUX
# Handles clean 2D vector HUD, dynamic Xbox/PlayStation/Keyboard input prompts, speedrun timer, and state indicators.

enum ControllerType {
	KEYBOARD,
	XBOX,
	PLAYSTATION
}

var current_controller: ControllerType = ControllerType.KEYBOARD

@onready var timer_label: Label = $HUD/MarginContainer/VBoxContainer/TopRow/TimerLabel
@onready var level_label: Label = $HUD/MarginContainer/VBoxContainer/TopRow/LevelLabel
@onready var state_container: HBoxContainer = $HUD/MarginContainer/VBoxContainer/BottomRow/StateContainer
@onready var pause_panel: Control = $PauseMenu

var elapsed_time: float = 0.0
var is_timer_running: bool = true

func _ready() -> void:
	# Listen for joypad connection / activity
	Input.joy_connection_changed.connect(_on_joy_connection_changed)
	_detect_active_controller()

func _input(event: InputEvent) -> void:
	if event is InputEventJoypadButton or event is InputEventJoypadMotion:
		_detect_active_controller()
	elif event is InputEventKey:
		current_controller = ControllerType.KEYBOARD

	if Input.is_action_just_pressed("pause"):
		toggle_pause()

func _process(delta: float) -> void:
	if is_timer_running:
		elapsed_time += delta
		if timer_label:
			timer_label.text = _format_time(elapsed_time)

func _detect_active_controller() -> void:
	var joy_names = Input.get_connected_joypads()
	if joy_names.size() > 0:
		var name_str = Input.get_joy_name(joy_names[0]).to_lower()
		if "playstation" in name_str or "ps4" in name_str or "ps5" in name_str or "dualshock" in name_str or "dualsense" in name_str:
			current_controller = ControllerType.PLAYSTATION
		else:
			current_controller = ControllerType.XBOX
	else:
		current_controller = ControllerType.KEYBOARD

func _on_joy_connection_changed(_device: int, _connected: bool) -> void:
	_detect_active_controller()

func get_button_glyph_label(action: String) -> String:
	match current_controller:
		ControllerType.XBOX:
			match action:
				"jump": return "[A]"
				"restart": return "[Y]"
				"state_heavy": return "[LB]"
				"state_light": return "[RB]"
				"state_magnetic": return "[X]"
				"state_elastic": return "[B]"
				"state_frozen": return "[LT]"
				"state_phase": return "[RT]"
				"pause": return "[Menu]"
		ControllerType.PLAYSTATION:
			match action:
				"jump": return "[✕]"
				"restart": return "[△]"
				"state_heavy": return "[L1]"
				"state_light": return "[R1]"
				"state_magnetic": return "[□]"
				"state_elastic": return "[○]"
				"state_frozen": return "[L2]"
				"state_phase": return "[R2]"
				"pause": return "[Options]"
		_:
			match action:
				"jump": return "[SPACE]"
				"restart": return "[R]"
				"state_heavy": return "[1]"
				"state_light": return "[2]"
				"state_magnetic": return "[3]"
				"state_elastic": return "[4]"
				"state_frozen": return "[5]"
				"state_phase": return "[6]"
				"pause": return "[ESC]"
	return ""

func toggle_pause() -> void:
	var paused = get_tree().paused
	get_tree().paused = !paused
	if pause_panel:
		pause_panel.visible = !paused

func _format_time(time_sec: float) -> String:
	var mins = int(time_sec / 60.0)
	var secs = int(time_sec) % 60
	var millis = int((time_sec - int(time_sec)) * 100.0)
	return "%02d:%02d.%02d" % [mins, secs, millis]
