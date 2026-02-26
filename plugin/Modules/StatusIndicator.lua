local StatusIndicator = {}

local toolbar
local button
local currentState = "Disconnected"

local STATES = {
	Connected    = { label = "Bloxr — Connected ✓",     tooltip = "Bloxr is synced with your Studio" },
	Syncing      = { label = "Bloxr — Syncing...",       tooltip = "Inserting from Bloxr..." },
	Disconnected = { label = "Bloxr — Disconnected",     tooltip = "Click to reconnect to Bloxr" },
	Connecting   = { label = "Bloxr — Connecting...",    tooltip = "Connecting to Bloxr..." },
}

function StatusIndicator.init(tb, btn)
	toolbar = tb
	button = btn
	StatusIndicator.set("Disconnected")
end

function StatusIndicator.set(state)
	currentState = state
	local info = STATES[state] or STATES.Disconnected
	if button then
		button.Name = info.label
		button.ClickableWhenViewportHidden = true
	end
	print("[Bloxr] Status:", state)
end

function StatusIndicator.get()
	return currentState
end

return StatusIndicator
