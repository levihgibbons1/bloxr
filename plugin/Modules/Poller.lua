local HttpService = game:GetService("HttpService")
local Poller      = {}

local SERVER_URL   = "https://server-production-a106.up.railway.app"
local POLL_RATE    = 1.5
local HEARTBEAT    = 10
local sessionToken = ""
local userId       = ""
local onPayload    = nil
local onStatus     = nil
local running      = false

function Poller.init(token, uid, payloadCallback, statusCallback)
	sessionToken  = token or ""
	userId        = uid   or ""
	onPayload     = payloadCallback
	onStatus      = statusCallback
end

local function headers()
	return {
		["Content-Type"]  = "application/json",
		["Authorization"] = "Bearer " .. sessionToken,
	}
end

local function request(method, endpoint, body)
	local opts = {
		Url     = SERVER_URL .. endpoint,
		Method  = method,
		Headers = headers(),
	}
	if body then
		opts.Body = HttpService:JSONEncode(body)
	end
	return HttpService:RequestAsync(opts)
end

local function confirm(id)
	pcall(function()
		request("POST", "/api/sync/confirm", { id = id })
	end)
end

local function pollLoop()
	while running do
		local ok, result = pcall(function()
			local res = request("GET", "/api/sync/pending")
			if res.StatusCode == 200 and res.Body and res.Body ~= "" and res.Body ~= "null" then
				local payload = HttpService:JSONDecode(res.Body)
				if payload and payload.id then
					if onStatus then onStatus("Syncing") end
					local inner = payload.payload or payload
					if onPayload then onPayload(inner) end
					confirm(payload.id)
					if onStatus then onStatus("Connected") end
				end
			elseif res.StatusCode == 401 then
				if onStatus then onStatus("Disconnected") end
				running = false
				warn("[Bloxr] Unauthorized — check your session token")
			end
		end)

		if not ok then
			if onStatus then onStatus("Disconnected") end
			warn("[Bloxr] Poll error:", result)
		end

		task.wait(POLL_RATE)
	end
end

local function heartbeatLoop()
	while running do
		pcall(function()
			request("GET", "/api/sync/heartbeat")
		end)
		task.wait(HEARTBEAT)
	end
end

function Poller.start()
	running = true
	if onStatus then onStatus("Connecting") end
	task.spawn(pollLoop)
	task.spawn(heartbeatLoop)
	print("[Bloxr] Poller started — polling every", POLL_RATE, "seconds")
end

function Poller.stop()
	running = false
	print("[Bloxr] Poller stopped")
end

return Poller
