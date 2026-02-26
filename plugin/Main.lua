--!strict
-- ╔══════════════════════════════════════╗
-- ║   BLOXR STUDIO PLUGIN — Main         ║
-- ║   bloxr.dev                          ║
-- ╚══════════════════════════════════════╝

local SERVER_URL = "https://server-production-a106.up.railway.app"

local HttpService    = game:GetService("HttpService")
local RunService     = game:GetService("RunService")

if not RunService:IsStudio() then return end

local Modules          = script.Parent.Modules
local StatusIndicator  = require(Modules.StatusIndicator)
local Inserter         = require(Modules.Inserter)
local Poller           = require(Modules.Poller)
local ErrorCapture     = require(Modules.ErrorCapture)
local ContextSnapshot  = require(Modules.ContextSnapshot)

-- ── TOOLBAR SETUP ──────────────────────────────────────
local toolbar = plugin:CreateToolbar("Bloxr")
local button  = toolbar:CreateButton(
	"Bloxr",
	"AI-powered Roblox development — bloxr.dev",
	"rbxassetid://75215376247135"
)
button.ClickableWhenViewportHidden = true

StatusIndicator.init(toolbar, button)

-- ── SESSION TOKEN ──────────────────────────────────────
local function getSavedToken()
	return plugin:GetSetting("bloxr_token") or ""
end

local function saveToken(token)
	plugin:SetSetting("bloxr_token", token)
end

-- ── MANAGE WIDGET ──────────────────────────────────────
local manageWidget = nil
local lastBuiltLabel = nil

local function updateLastBuiltLabel()
	if not lastBuiltLabel then return end
	local lb = Inserter.getLastBuilt()
	if lb.name ~= "" then
		lastBuiltLabel.Text = "Last: " .. lb.name .. " → " .. lb.service
	else
		lastBuiltLabel.Text = "Last: —"
	end
end

local function createManageWidget()
	local widgetInfo = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Float, true, false, 300, 200, 200, 150)
	local widget = plugin:CreateDockWidgetPluginGui("BloxrManage", widgetInfo)
	widget.Title = "Bloxr"

	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(1, 0, 1, 0)
	frame.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
	frame.BorderSizePixel = 0
	frame.Parent = widget

	local status = Instance.new("TextLabel")
	status.Size = UDim2.new(1, -20, 0, 30)
	status.Position = UDim2.new(0, 10, 0, 12)
	status.BackgroundTransparency = 1
	status.TextColor3 = Color3.fromRGB(180, 180, 180)
	status.Font = Enum.Font.Gotham
	status.TextSize = 12
	status.Text = "Connected to bloxr.dev"
	status.TextXAlignment = Enum.TextXAlignment.Left
	status.Parent = frame

	-- Last built label (item 20)
	local lbl = Instance.new("TextLabel")
	lbl.Size = UDim2.new(1, -20, 0, 24)
	lbl.Position = UDim2.new(0, 10, 0, 46)
	lbl.BackgroundTransparency = 1
	lbl.TextColor3 = Color3.fromRGB(120, 120, 120)
	lbl.Font = Enum.Font.Gotham
	lbl.TextSize = 11
	lbl.Text = "Last: —"
	lbl.TextXAlignment = Enum.TextXAlignment.Left
	lbl.Parent = frame
	lastBuiltLabel = lbl

	local disconnectBtn = Instance.new("TextButton")
	disconnectBtn.Size = UDim2.new(1, -20, 0, 34)
	disconnectBtn.Position = UDim2.new(0, 10, 0, 82)
	disconnectBtn.BackgroundColor3 = Color3.fromRGB(200, 50, 50)
	disconnectBtn.BorderSizePixel = 0
	disconnectBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	disconnectBtn.Font = Enum.Font.GothamMedium
	disconnectBtn.TextSize = 13
	disconnectBtn.Text = "Disconnect & Change Token"
	disconnectBtn.Parent = frame

	local closeBtn = Instance.new("TextButton")
	closeBtn.Size = UDim2.new(1, -20, 0, 34)
	closeBtn.Position = UDim2.new(0, 10, 0, 124)
	closeBtn.BackgroundColor3 = Color3.fromRGB(40, 40, 40)
	closeBtn.BorderSizePixel = 0
	closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	closeBtn.Font = Enum.Font.GothamMedium
	closeBtn.TextSize = 13
	closeBtn.Text = "Close"
	closeBtn.Parent = frame

	disconnectBtn.MouseButton1Click:Connect(function()
		plugin:SetSetting("bloxr_token", nil)
		Poller.stop()
		widget.Enabled = false
		manageWidget = nil
		lastBuiltLabel = nil
		StatusIndicator.set("Disconnected")
		startup()
	end)
	closeBtn.MouseButton1Click:Connect(function()
		widget.Enabled = false
	end)

	return widget
end

-- ── CONNECT WIDGET ─────────────────────────────────────
local function showConnectWidget()
	local widgetInfo = DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Float, true, false, 300, 200, 200, 150)
	local widget = plugin:CreateDockWidgetPluginGui("BloxrConnect", widgetInfo)
	widget.Title = "Connect Bloxr"

	local frame = Instance.new("Frame")
	frame.Size = UDim2.new(1, 0, 1, 0)
	frame.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
	frame.BorderSizePixel = 0
	frame.Parent = widget

	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, -20, 0, 60)
	label.Position = UDim2.new(0, 10, 0, 20)
	label.BackgroundTransparency = 1
	label.TextColor3 = Color3.fromRGB(255, 255, 255)
	label.TextWrapped = true
	label.Font = Enum.Font.GothamMedium
	label.TextSize = 13
	label.Text = "Visit bloxr.dev and click\n'Connect Studio' to link\nyour account."
	label.Parent = frame

	local input = Instance.new("TextBox")
	input.Size = UDim2.new(1, -20, 0, 32)
	input.Position = UDim2.new(0, 10, 0, 100)
	input.BackgroundColor3 = Color3.fromRGB(30, 30, 30)
	input.BorderSizePixel = 0
	input.TextColor3 = Color3.fromRGB(255, 255, 255)
	input.PlaceholderText = "Paste token here..."
	input.Font = Enum.Font.Gotham
	input.TextSize = 12
	input.ClearTextOnFocus = true
	input.Parent = frame

	local saveBtn = Instance.new("TextButton")
	saveBtn.Size = UDim2.new(1, -20, 0, 32)
	saveBtn.Position = UDim2.new(0, 10, 0, 140)
	saveBtn.BackgroundColor3 = Color3.fromRGB(79, 142, 247)
	saveBtn.BorderSizePixel = 0
	saveBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	saveBtn.Font = Enum.Font.GothamMedium
	saveBtn.TextSize = 13
	saveBtn.Text = "Connect"
	saveBtn.Parent = frame

	return widget, input, saveBtn
end

-- ── MAIN STARTUP ───────────────────────────────────────
function startup()
	local token = getSavedToken()

	if token == "" then
		print("[Bloxr] No token found — showing connect widget")
		StatusIndicator.set("Disconnected")

		local widget, input, saveBtn = showConnectWidget()
		saveBtn.MouseButton1Click:Connect(function()
			local t = input.Text:match("^%s*(.-)%s*$")
			if t and #t > 10 then
				saveToken(t)
				widget.Enabled = false
				print("[Bloxr] Token saved — restarting...")
				startup()
			else
				input.PlaceholderText = "Invalid token, try again"
			end
		end)
	else
		print("[Bloxr] Token found — starting sync...")

		pcall(function()
			HttpService:RequestAsync({
				Url    = SERVER_URL .. "/api/sync/place",
				Method = "POST",
				Headers = {
					["Content-Type"]  = "application/json",
					["Authorization"] = "Bearer " .. token,
				},
				Body = HttpService:JSONEncode({ placeId = game.PlaceId, gameId = game.GameId }),
			})
		end)

		-- Init all modules
		ErrorCapture.init(token)
		ErrorCapture.start()

		ContextSnapshot.init(token)
		ContextSnapshot.send()      -- initial snapshot on connect
		ContextSnapshot.startLoop() -- then every 30s

		Poller.init(
			token,
			"",
			function(payload)
				Inserter.handle(payload)
				-- Snapshot after every successful insert (item 17)
				ContextSnapshot.send()
				-- Update manage widget label (item 20)
				updateLastBuiltLabel()
			end,
			function(state)
				StatusIndicator.set(state)
			end
		)

		Poller.start()
		StatusIndicator.set("Connected")
		print("[Bloxr] ✓ Connected — ready for prompts")
	end
end

-- Button click = toggle manage widget
button.Click:Connect(function()
	if manageWidget and manageWidget.Enabled then
		manageWidget.Enabled = false
		return
	end
	if not manageWidget then
		manageWidget = createManageWidget()
	else
		manageWidget.Enabled = true
	end
	updateLastBuiltLabel()
end)

startup()
