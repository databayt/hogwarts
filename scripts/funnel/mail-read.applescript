-- Read recent inbox messages for one Mail.app account.
--
--   osascript scripts/jobs/mail-read.applescript <accountEmail> <hoursBack>
--
-- Output: one record per message, fields separated by ASCII 31 and records by
-- ASCII 30 — sender, subject, ISO-ish date, first 3000 chars of the body.
on run argv
	set acctEmail to item 1 of argv
	set hoursBack to (item 2 of argv) as integer
	set cutoff to (current date) - (hoursBack * hours)
	set US to ASCII character 31
	set RS to ASCII character 30
	set out to ""
	tell application "Mail"
		set target to missing value
		repeat with acct in accounts
			if (email addresses of acct) contains acctEmail then set target to acct
		end repeat
		if target is missing value then error "no Mail.app account for " & acctEmail number 1001
		repeat with mb in mailboxes of target
			if name of mb is in {"INBOX", "Inbox", "Junk", "Junk Email"} then
				set msgs to (messages of mb whose date received > cutoff)
				repeat with m in msgs
					set c to content of m
					if (length of c) > 3000 then set c to text 1 thru 3000 of c
					set d to date received of m
					set out to out & (sender of m) & US & (subject of m) & US & ((year of d) as string) & "-" & ((month of d as integer) as string) & "-" & ((day of d) as string) & " " & ((time string of d) as string) & US & c & RS
				end repeat
			end if
		end repeat
	end tell
	return out
end run
