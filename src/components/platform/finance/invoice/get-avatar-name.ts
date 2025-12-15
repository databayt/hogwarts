export default function getAvatarName(
  firstName: string,
  lastName: string | null
) {
  if (!firstName) {
    return null
  }
  return lastName ? firstName[0] + lastName[0] : firstName[0]
}
