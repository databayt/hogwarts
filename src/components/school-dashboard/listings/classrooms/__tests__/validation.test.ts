import { describe, expect, it } from "vitest"

import {
  classroomBaseSchema,
  classroomCreateSchema,
  classroomUpdateSchema,
  getClassroomsSchema,
} from "../validation"

describe("Classroom Validation Schemas", () => {
  // ===========================================================================
  // classroomBaseSchema / classroomCreateSchema
  // ===========================================================================

  describe("classroomCreateSchema", () => {
    it("validates complete classroom data", () => {
      const validData = {
        roomName: "Lab A",
        typeId: "type-1",
        capacity: 30,
      }

      const result = classroomCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("rejects empty room name", () => {
      const data = {
        roomName: "",
        typeId: "type-1",
        capacity: 30,
      }

      const result = classroomCreateSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        const roomNameError = result.error.issues.find(
          (i) => i.path[0] === "roomName"
        )
        expect(roomNameError).toBeDefined()
        expect(roomNameError!.message).toBe("Room name is required")
      }
    })

    it("rejects missing room name", () => {
      const data = {
        typeId: "type-1",
        capacity: 30,
      }

      const result = classroomCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("rejects empty typeId", () => {
      const data = {
        roomName: "Lab A",
        typeId: "",
        capacity: 30,
      }

      const result = classroomCreateSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        const typeError = result.error.issues.find(
          (i) => i.path[0] === "typeId"
        )
        expect(typeError).toBeDefined()
        expect(typeError!.message).toBe("Room type is required")
      }
    })

    it("rejects capacity less than 1", () => {
      const data = {
        roomName: "Lab A",
        typeId: "type-1",
        capacity: 0,
      }

      const result = classroomCreateSchema.safeParse(data)
      expect(result.success).toBe(false)

      if (!result.success) {
        const capError = result.error.issues.find(
          (i) => i.path[0] === "capacity"
        )
        expect(capError).toBeDefined()
        expect(capError!.message).toBe("Capacity must be at least 1")
      }
    })

    it("rejects negative capacity", () => {
      const data = {
        roomName: "Lab A",
        typeId: "type-1",
        capacity: -5,
      }

      const result = classroomCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("rejects non-integer capacity", () => {
      const data = {
        roomName: "Lab A",
        typeId: "type-1",
        capacity: 25.5,
      }

      const result = classroomCreateSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it("shares the same shape as classroomBaseSchema", () => {
      const validData = {
        roomName: "Room 101",
        typeId: "type-1",
        capacity: 20,
      }

      const baseResult = classroomBaseSchema.safeParse(validData)
      const createResult = classroomCreateSchema.safeParse(validData)

      expect(baseResult.success).toBe(true)
      expect(createResult.success).toBe(true)
    })
  })

  // ===========================================================================
  // classroomUpdateSchema
  // ===========================================================================

  describe("classroomUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        roomName: "Updated Room",
      }

      const result = classroomUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with only id", () => {
      const idOnly = {
        id: "room-123",
      }

      const result = classroomUpdateSchema.safeParse(idOnly)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.id).toBe("room-123")
        expect(result.data.roomName).toBeUndefined()
        expect(result.data.typeId).toBeUndefined()
        expect(result.data.capacity).toBeUndefined()
      }
    })

    it("allows partial update with id and roomName only", () => {
      const partial = {
        id: "room-123",
        roomName: "New Name",
      }

      const result = classroomUpdateSchema.safeParse(partial)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.roomName).toBe("New Name")
        expect(result.data.capacity).toBeUndefined()
      }
    })

    it("rejects empty id", () => {
      const emptyId = {
        id: "",
        roomName: "Room",
      }

      const result = classroomUpdateSchema.safeParse(emptyId)
      expect(result.success).toBe(false)
    })
  })

  // ===========================================================================
  // getClassroomsSchema
  // ===========================================================================

  describe("getClassroomsSchema", () => {
    it("applies defaults for empty input", () => {
      const result = getClassroomsSchema.parse({})

      expect(result.page).toBe(1)
      expect(result.perPage).toBe(20)
      expect(result.name).toBe("")
      expect(result.typeId).toBe("")
      expect(result.building).toBe("")
    })

    it("validates pagination limits (perPage max 200)", () => {
      const tooMany = { perPage: 201 }
      const valid = { perPage: 100 }

      expect(getClassroomsSchema.safeParse(tooMany).success).toBe(false)
      expect(getClassroomsSchema.safeParse(valid).success).toBe(true)
    })

    it("rejects non-positive page number", () => {
      const zeroPage = { page: 0 }
      const negativePage = { page: -1 }

      expect(getClassroomsSchema.safeParse(zeroPage).success).toBe(false)
      expect(getClassroomsSchema.safeParse(negativePage).success).toBe(false)
    })

    it("accepts custom filter values", () => {
      const customInput = {
        page: 2,
        perPage: 50,
        name: "Lab",
        typeId: "type-science",
        building: "Building A",
      }

      const result = getClassroomsSchema.parse(customInput)

      expect(result.page).toBe(2)
      expect(result.perPage).toBe(50)
      expect(result.name).toBe("Lab")
      expect(result.typeId).toBe("type-science")
      expect(result.building).toBe("Building A")
    })
  })
})
