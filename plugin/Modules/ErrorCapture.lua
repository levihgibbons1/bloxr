local ScriptContext = game:GetService("ScriptContext")
local HttpService   = game:GetService("HttpService")
local ErrorCapture  = {}

local SERVER_URL   = "https://server-production-a106.up.railway.app"
local sessionToken = ""

function ErrorCapture.init(token)
	sessionToken = token or ""
end

function ErrorCapture.start()
	ScriptContext.Error:Connect(function(message, trace, script)
		if not script then return end
		if sessionToken == "" then return end

		-- Extract line number from trace: "Script 'Name', Line N"
		local line = 0
		local lineMatch = string.match(trace or "", "Line (%d+)")
		if lineMatch then
			line = tonumber(lineMatch) or 0
		end

		local ok, err = pcall(function()
			HttpService:RequestAsync({
				Url    = SERVER_URL .. "/api/sync/error",
				Method = "POST",
				Headers = {
					["Content-Type"]  = "application/json",
					["Authorization"] = "Bearer " .. sessionToken,
				},
				Body = HttpService:JSONEncode({
					message = tostring(message),
					script  = script.Name,
					line    = line,
				}),
			})
		end)

		if not ok then
			warn("[Bloxr] Failed to send error report:", err)
		else
			print("[Bloxr] ⚠ Error reported:", script.Name .. ":" .. line, "—", message)
		end
	end)

	print("[Bloxr] ErrorCapture listening...")
end

return ErrorCapture
