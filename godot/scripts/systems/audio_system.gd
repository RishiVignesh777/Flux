extends Node
class_name SoundManager

# Audio System for FLUX
# Generates responsive SFX and handles sound buses with volume control for Master, SFX, and Music.

var master_volume: float = 0.9
var sfx_volume: float = 0.8
var music_volume: float = 0.5

# Audio players pool
var players: Array[AudioStreamPlayer] = []
const POOL_SIZE = 8

func _ready() -> void:
	# Instantiate audio player pool
	for i in range(POOL_SIZE):
		var p = AudioStreamPlayer.new()
		add_child(p)
		players.append(p)

func play_synth_tone(freq: float, duration: float = 0.12, type: String = "sine") -> void:
	var player = _get_available_player()
	if not player:
		return

	var sample_rate = 44100
	var total_samples = int(sample_rate * duration)
	var audio_stream = AudioStreamWAV.new()
	audio_stream.format = AudioStreamWAV.FORMAT_16_BITS
	audio_stream.mix_rate = sample_rate
	audio_stream.stereo = false

	var buffer = PackedByteArray()
	buffer.resize(total_samples * 2)

	for i in range(total_samples):
		var t = float(i) / sample_rate
		var envelope = 1.0 - (float(i) / total_samples) # Linear decay
		var sample_val = 0.0

		if type == "sine":
			sample_val = sin(t * freq * TAU)
		elif type == "square":
			sample_val = 1.0 if sin(t * freq * TAU) > 0 else -1.0
		elif type == "noise":
			sample_val = (randf() * 2.0 - 1.0)

		var int_sample = int(clamp(sample_val * envelope * 0.4 * sfx_volume * master_volume, -1.0, 1.0) * 32767.0)
		buffer.encode_s16(i * 2, int_sample)

	audio_stream.data = buffer
	player.stream = audio_stream
	player.play()

func _get_available_player() -> AudioStreamPlayer:
	for p in players:
		if not p.playing:
			return p
	return players[0]

# High-level sound actions
func play_jump() -> void:
	play_synth_tone(520.0, 0.10, "sine")

func play_land() -> void:
	play_synth_tone(140.0, 0.08, "sine")

func play_bounce() -> void:
	play_synth_tone(660.0, 0.14, "sine")

func play_state_switch(_state: int) -> void:
	play_synth_tone(440.0, 0.08, "square")

func play_death() -> void:
	play_synth_tone(180.0, 0.25, "noise")

func play_win() -> void:
	play_synth_tone(880.0, 0.30, "sine")

func play_plate(pressed: bool) -> void:
	play_synth_tone(240.0 if pressed else 200.0, 0.06, "sine")

func play_magnet_pull() -> void:
	play_synth_tone(320.0, 0.15, "square")

func play_launch() -> void:
	play_synth_tone(700.0, 0.18, "sine")

func play_shard() -> void:
	play_synth_tone(1040.0, 0.18, "sine")

func play_gravity_shift() -> void:
	play_synth_tone(300.0, 0.22, "sine")
