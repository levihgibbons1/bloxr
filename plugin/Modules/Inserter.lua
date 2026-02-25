--[[
  ServerStorage.BloxrPlugin.Modules.Inserter
  Handles inserting scripts and parts into the game from sync_queue payloads.
--]]

local Inserter = {}

-- Insert a Luau script into the appropriate Roblox service.
function Inserter.insertScript(payload)
	local serviceName = payload.targetService
	if not serviceName then
		warn("[Bloxr] insertScript: missing targetService")
		return
	end

	local targetService = game:GetService(serviceName)
	if not targetService then
		warn("[Bloxr] insertScript: could not find service '" .. tostring(serviceName) .. "'")
		return
	end

	local scriptTypeMap = {
		Script = "Script",
		LocalScript = "LocalScript",
		ModuleScript = "ModuleScript",
	}

	local className = scriptTypeMap[payload.scriptType] or "Script"
	local instance = Instance.new(className)
	instance.Name = payload.name or "BloxrScript"
	instance.Source = payload.code or ""
	instance.Parent = targetService

	print("[Bloxr] ✓ Inserted " .. className .. " '" .. instance.Name .. "' into " .. targetService.Name)
end

-- Insert a simple 3D part into Workspace from a "part" payload.
function Inserter.insertPart(payload)
	local className = payload.className or "Part"

	local ok, instance = pcall(Instance.new, className)
	if not ok then
		warn("[Bloxr] insertPart: unknown className '" .. tostring(className) .. "'")
		return
	end

	instance.Name = payload.name or "BloxrPart"

	local props = payload.properties or {}

	-- BrickColor
	if props.BrickColor then
		local colorOk, color = pcall(BrickColor.new, props.BrickColor)
		if colorOk then
			instance.BrickColor = color
		end
	end

	-- Size — expects [x, y, z] array
	if props.Size then
		local s = props.Size
		instance.Size = Vector3.new(s[1] or 4, s[2] or 1, s[3] or 2)
	end

	-- Position — expects [x, y, z] array
	if props.Position then
		local p = props.Position
		instance.Position = Vector3.new(p[1] or 0, p[2] or 10, p[3] or 0)
	end

	-- Anchored
	if props.Anchored ~= nil then
		instance.Anchored = props.Anchored
	end

	-- Material — e.g. "SmoothPlastic", "Neon", "Wood"
	if props.Material then
		local matOk, mat = pcall(function()
			return Enum.Material[props.Material]
		end)
		if matOk and mat then
			instance.Material = mat
		end
	end

	-- Shape (Part only) — e.g. "Ball", "Cylinder", "Block"
	if props.Shape and className == "Part" then
		local shapeOk, shape = pcall(function()
			return Enum.PartType[props.Shape]
		end)
		if shapeOk and shape then
			instance.Shape = shape
		end
	end

	-- CastShadow
	if props.CastShadow ~= nil then
		instance.CastShadow = props.CastShadow
	end

	-- CanCollide
	if props.CanCollide ~= nil then
		instance.CanCollide = props.CanCollide
	end

	instance.Parent = game.Workspace

	print("[Bloxr] ✓ Inserted part '" .. instance.Name .. "' (" .. className .. ") into Workspace")
end

-- Route a sync_queue payload to the correct insert function.
function Inserter.handle(payload)
	if payload.type == "script" then
		Inserter.insertScript(payload)
	elseif payload.type == "part" then
		Inserter.insertPart(payload)
	else
		warn("[Bloxr] Inserter.handle: unknown payload type '" .. tostring(payload.type) .. "'")
	end
end

return Inserter
