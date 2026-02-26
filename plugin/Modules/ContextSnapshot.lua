local HttpService = game:GetService("HttpService")
local ContextSnapshot = {}

local SERVER_URL = "https://server-production-a106.up.railway.app"
local sessionToken = ""

local SCAN_SERVICES = {
	"ServerScriptService",
	"StarterPlayerScripts",
	"StarterGui",
	"ReplicatedStorage",
}

function ContextSnapshot.init(token)
	sessionToken = token or ""
end

local function buildSnapshot()
	local items = {}
	for _, serviceName in ipairs(SCAN_SERVICES) do
		local ok, service = pcall(function() return game:GetService(serviceName) end)
		if ok and service then
			for _, child in ipairs(service:GetChildren()) do
				table.insert(items, serviceName .. ": " .. child.Name .. " (" .. child.ClassName .. ")")
			end
		end
	end
	-- Workspace direct children only
	for _, child in ipairs(workspace:GetChildren()) do
		if child.ClassName ~= "Terrain" and child.ClassName ~= "Camera" then
			table.insert(items, "Workspace: " .. child.Name .. " (" .. child.ClassName .. ")")
		end
	end
	return items
end

function ContextSnapshot.send()
	if sessionToken == "" then return end
	local items = buildSnapshot()
	pcall(function()
		HttpService:RequestAsync({
			Url    = SERVER_URL .. "/api/sync/context",
			Method = "POST",
			Headers = {
				["Content-Type"]  = "application/json",
				["Authorization"] = "Bearer " .. sessionToken,
			},
			Body = HttpService:JSONEncode({ context = items }),
		})
	end)
	print("[Bloxr] Context snapshot sent — " .. #items .. " items")
end

function ContextSnapshot.startLoop()
	task.spawn(function()
		while true do
			task.wait(30)
			ContextSnapshot.send()
		end
	end)
end

return ContextSnapshot
