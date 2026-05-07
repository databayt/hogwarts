// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BookCard } from "./cards/book-card"
import { ExamCard } from "./cards/exam-card"
import { MaterialCard } from "./cards/material-card"
import { QuestionCard } from "./cards/question-card"
import { TextbookCard } from "./cards/textbook-card"
import { VideoCard } from "./cards/video-card"
import type {
  CommunityBookCard,
  CommunityExamCard,
  CommunityMaterialCard,
  CommunityQuestionCard,
  CommunityResourceType,
  CommunityTextbookCard,
  CommunityVideoCard,
} from "./types"

/**
 * Discriminated-union props so each grid binds the right card to the right
 * data shape at the type level. Keeps the page files slim — they pass
 * `type` + `items` and the grid does the rest.
 */
type Props =
  | { type: "textbooks"; items: CommunityTextbookCard[] }
  | { type: "exams"; items: CommunityExamCard[] }
  | { type: "qbank"; items: CommunityQuestionCard[] }
  | { type: "videos"; items: CommunityVideoCard[] }
  | { type: "materials"; items: CommunityMaterialCard[] }
  | { type: "books"; items: CommunityBookCard[] }

export function CommunityResourceGrid(props: Props) {
  // Cover/thumbnail-heavy types want denser grids; text-heavy types breathe more.
  const dense: CommunityResourceType[] = ["textbooks", "books", "videos"]
  const cols = dense.includes(props.type)
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

  return <div className={`grid gap-4 ${cols}`}>{renderCards(props)}</div>
}

function renderCards(props: Props) {
  switch (props.type) {
    case "textbooks":
      return props.items.map((item) => (
        <TextbookCard key={item.id} item={item} />
      ))
    case "exams":
      return props.items.map((item) => <ExamCard key={item.id} item={item} />)
    case "qbank":
      return props.items.map((item) => (
        <QuestionCard key={item.id} item={item} />
      ))
    case "videos":
      return props.items.map((item) => <VideoCard key={item.id} item={item} />)
    case "materials":
      return props.items.map((item) => (
        <MaterialCard key={item.id} item={item} />
      ))
    case "books":
      return props.items.map((item) => <BookCard key={item.id} item={item} />)
  }
}
