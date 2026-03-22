Config = {}

Config.DiscordInvite = "DISCORD.GG/LASTVRP"

Config.InfoTips = {
    "Create your bank account at the Central Bank",
    "Visit the DMV to get your driver's license",
    "Use your phone to call a taxi or EMS",
    "Attend driving school to improve your skills",
    "Respect traffic laws and speed limits",
    "Buy a radio to communicate with your friends",
    "Check the job listings to find employment",
    "Doctors are available at the main hospital",
    "Protect your belongings with locks and alarms",
    "Avoid red zones if you are a beginner"
}

-- ── Patch Notes ──────────────────────────────────────────────────────────────
Config.PatchNotes = {
    { version = "v2.4.1", entries = {
        "Added new illegal drug lab location near Sandy Shores",
        "Reworked police MDT with new warrant system",
        "New vehicle dealership with 12 additional cars",
        "Fixed inventory duplication exploit",
        "Improved server tick rate stability",
        "New job: Garbage Collector with dynamic routes",
        "Housing system now supports furniture placement",
        "Fixed EMS revive animation not triggering correctly"
    }},
    { version = "v2.3.0", entries = {
        "Introduced the banking heist event",
        "New phone UI with contacts and messages",
        "Optimized vehicle spawn system",
        "Added tattoo shop at Mirror Park"
    }}
}

-- ── Base Rules ───────────────────────────────────────────────────────────────
Config.BaseRules = {
    "Respect all players and staff at all times",
    "No cheating, hacking, modding or exploiting bugs",
    "Roleplay must remain realistic and immersive",
    "No random deathmatch (RDM) or vehicle deathmatch (VDM)",
    "Follow staff instructions without arguing in-game",
    "No metagaming — keep OOC info out of RP",
    "No powergaming or forcing RP on others",
    "New Life Rule (NLR) applies after every death",
    "No combat logging — stay connected during RP situations",
    "Mic required — text RP is not accepted",
    "No advertising other servers or communities",
    "Racism, harassment or hate speech = permanent ban"
}

-- ── Staff ────────────────────────────────────────────────────────────────────
-- Roles: owner | dev | admin | mod | support
Config.Staff = {
    -- Owner
    { role = "owner", name = "Vortex" },
    { role = "owner", name = "Krypto" },
    -- Developer
    { role = "dev",   name = "NexCode" },
    { role = "dev",   name = "ByteWolf" },
    { role = "dev",   name = "Phantom" },
    -- Admin
    { role = "admin", name = "Striker" },
    { role = "admin", name = "Zephyr" },
    -- Moderator
    { role = "mod",   name = "Blaze" },
    { role = "mod",   name = "Cipher" },
    { role = "mod",   name = "Raven" },
    -- Support
    { role = "support", name = "Frost" },
    { role = "support", name = "Lynx" },
    { role = "support", name = "Dusk" },
    { role = "support", name = "Orion" }
}
