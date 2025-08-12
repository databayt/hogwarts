"use client";

export function TimetableContent() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu"];
  const periods = [1, 2, 3, 4, 5, 6];
  const [conflicts, setConflicts] = React.useState<Array<{ type: string; classA: { name: string }; classB: { name: string }; teacher?: { name: string } | null; room?: { name: string } | null }>>([])
  const [checking, setChecking] = React.useState(false)
  const [termId, setTermId] = React.useState<string>("")
  const [terms, setTerms] = React.useState<Array<{ id: string; label: string }>>([])
  const onCheckConflicts = async () => {
    setChecking(true)
    try {
      const { detectTimetableConflicts } = await import('./actions')
      const res = await detectTimetableConflicts({ termId: termId || undefined })
      setConflicts(res.conflicts)
    } finally {
      setChecking(false)
    }
  }
  React.useEffect(() => {
    ;(async () => {
      const { getTermsForSelection } = await import('./actions')
      const res = await getTermsForSelection()
      setTerms(res.terms)
      if (!termId && res.terms[0]) setTermId(res.terms[0].id)
    })()
  }, [])
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-2 text-sm font-medium">Weekly Timetable (placeholder)</div>
      <div className="mb-3 flex items-center gap-2">
        <select className="h-8 rounded-md border px-2 text-xs" value={termId} onChange={(e) => setTermId(e.target.value)}>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button onClick={onCheckConflicts} className="h-8 rounded-md border px-3 text-xs" disabled={checking}>{checking ? 'Checking…' : 'Check conflicts'}</button>
        {conflicts.length > 0 && (
          <div className="text-xs text-red-600">{conflicts.length} conflict(s) found</div>
        )}
      </div>
      <div className="grid grid-cols-6 gap-px rounded-md border bg-border text-xs">
        <div className="bg-muted p-2 font-medium">Period</div>
        {days.map((d) => (
          <div key={d} className="bg-muted p-2 font-medium text-center">
            {d}
          </div>
        ))}
        {periods.map((p) => (
          <>
            <div key={`p-${p}`} className="bg-background p-2 font-medium">
              {p}
            </div>
            {days.map((d) => (
              <div key={`${d}-${p}`} className="bg-background p-2 h-14" />
            ))}
          </>
        ))}
      </div>
      {conflicts.length > 0 && (
        <div className="mt-3 rounded-md border p-2">
          <div className="mb-1 text-xs font-medium">Conflicts</div>
          <ul className="text-xs list-disc pl-5">
            {conflicts.map((c, i) => (
              <li key={i}>
                {c.type === 'TEACHER' ? 'Teacher' : 'Room'} conflict: {c.classA.name} vs {c.classB.name} {c.teacher?.name ? `(${c.teacher.name})` : c.room?.name ? `(${c.room.name})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}



