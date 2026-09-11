import re
jsx = open(".wordmark/out.jsx").read().split("\n")
vb = open(".wordmark/vb.txt").read().strip()
outline, fill = jsx[0], jsx[2]

def wrap(s, indent="        "):
    return "\n".join(indent + p for p in s.replace("/><", "/>\x00<").split("\x00"))

tpl = open("scripts/wordmark/component.tpl", encoding="utf-8").read()
out = (tpl.replace("%VB%", vb).replace("%OUTLINE%", wrap(outline))
          .replace("%GUIDE%", "").replace("%FILL%", wrap(fill)))
open("src/components/saas-marketing/thmanyah/atom/WordmarkWriting.tsx", "w").write(out)

print("wrote WordmarkWriting.tsx")
