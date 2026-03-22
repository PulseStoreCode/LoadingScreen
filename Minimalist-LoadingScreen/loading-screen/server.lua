AddEventHandler("playerConnecting", function(_, _, deferrals)
    local invite = Config and Config.DiscordInvite or "DISCORD.GG/FIVEMPULSE"
    local tips = Config and Config.InfoTips or nil

    deferrals.handover({
        discordInvite = invite,
        infoTips = tips
    })
end)

