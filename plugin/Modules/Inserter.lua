local CollectionService = game:GetService("CollectionService")
local Inserter = {}

local TAG = "BloxrGenerated"

-- Last built indicator (item 20)
local lastBuilt = { name = "", service = "" }

function Inserter.getLastBuilt()
	return lastBuilt
end

local function getService(name)
	return game:GetService(name)
end

local function tagInstance(inst, promptId)
	CollectionService:AddTag(inst, TAG)
	if promptId and promptId ~= "" then
		CollectionService:AddTag(inst, "BloxrPrompt_" .. promptId)
	end
end

function Inserter.insertScript(payload)
	local scriptType    = payload.scriptType    or "Script"
	local targetService = payload.targetService or "ServerScriptService"
	local code          = payload.code          or "-- Empty script"
	local name          = payload.name          or "BloxrScript"
	local promptId      = payload.id            or ""

	local inst = Instance.new(scriptType)
	inst.Name   = name
	inst.Source = code

	local ok, err = pcall(function()
		inst.Parent = getService(targetService)
	end)

	if not ok then
		inst.Parent = getService("ServerScriptService")
		targetService = "ServerScriptService"
		warn("[Bloxr] Could not place in " .. (payload.targetService or "") .. ", fallback to ServerScriptService:", err)
	end

	tagInstance(inst, promptId)
	lastBuilt = { name = name, service = targetService }
	print("[Bloxr] ✓ Done — '" .. name .. "' added to " .. targetService)
	return inst
end

function Inserter.insertPart(payload)
	local name      = payload.name      or "BloxrPart"
	local className = payload.className or "Part"
	local props     = payload.properties or {}
	local promptId  = payload.id        or ""

	local inst = Instance.new(className)
	inst.Name = name

	-- BrickColor
	if props.BrickColor then
		local ok, color = pcall(BrickColor.new, props.BrickColor)
		if ok then inst.BrickColor = color end
	end

	-- Size
	if props.Size and type(props.Size) == "table" then
		local s = props.Size
		pcall(function() inst.Size = Vector3.new(s[1] or 4, s[2] or 1, s[3] or 2) end)
	end

	-- Position
	if props.Position and type(props.Position) == "table" then
		local p = props.Position
		pcall(function() inst.Position = Vector3.new(p[1] or 0, p[2] or 1, p[3] or 0) end)
	end

	-- Material — use Enum.Material[val] (item 19)
	if props.Material then
		pcall(function()
			local mat = Enum.Material[props.Material]
			if mat then inst.Material = mat end
		end)
	end

	-- Shape (Part only)
	if props.Shape and className == "Part" then
		pcall(function()
			local shape = Enum.PartType[props.Shape]
			if shape then inst.Shape = shape end
		end)
	end

	-- All other properties — silent pcall
	local handled = { BrickColor=true, Size=true, Position=true, Material=true, Shape=true }
	for prop, val in pairs(props) do
		if not handled[prop] then
			pcall(function() inst[prop] = val end)
		end
	end

	inst.Parent = workspace
	tagInstance(inst, promptId)
	lastBuilt = { name = name, service = "Workspace" }
	print("[Bloxr] ✓ Done — '" .. name .. "' placed in Workspace")
	return inst
end

function Inserter.handle(payload)
	if not payload or not payload.type then return end
	local t = payload.type
	if t == "script" then
		return Inserter.insertScript(payload)
	elseif t == "part" then
		return Inserter.insertPart(payload)
	else
		warn("[Bloxr] Unknown payload type:", t)
	end
end

return Inserter
