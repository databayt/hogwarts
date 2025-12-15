# API: {{name}}

## Overview

{{description}}

## Endpoint

```
{{method}} {{path}}
```

## Authentication

- **Required**: {{authRequired}}
- **Roles**: {{allowedRoles}}
- **Multi-Tenant**: {{multiTenant}}

## Request

### Parameters

| Name | Type | Required | Description |
| ---- | ---- | -------- | ----------- |

{{#parameters}}
| {{name}} | `{{type}}` | {{required}} | {{description}} |
{{/parameters}}

### Body Schema

```typescript
{
  {
    bodySchema
  }
}
```

### Example Request

```typescript
{
  {
    exampleRequest
  }
}
```

## Response

### Success Response

**Status Code**: {{successCode}}

**Schema**:

```typescript
{
  {
    responseSchema
  }
}
```

**Example**:

```json
{{exampleResponse}}
```

### Error Responses

| Status | Code | Description |
| ------ | ---- | ----------- |

{{#errors}}
| {{status}} | {{code}} | {{description}} |
{{/errors}}

## Implementation

### Server Action

```typescript
{
  {
    implementation
  }
}
```

### Validation

```typescript
{
  {
    validation
  }
}
```

### Database Query

```prisma
{{prismaQuery}}
```

## Multi-Tenant Considerations

- All queries include `schoolId` filter
- Data isolation enforced at database level
- Session validation required

## Performance

- **Average Response Time**: {{avgResponseTime}}ms
- **Cache Strategy**: {{cacheStrategy}}
- **Rate Limiting**: {{rateLimit}}

## Testing

### Unit Tests

```typescript
{
  {
    unitTests
  }
}
```

### Integration Tests

```typescript
{
  {
    integrationTests
  }
}
```

### Coverage

- **Line Coverage**: {{lineCoverage}}%
- **Branch Coverage**: {{branchCoverage}}%

## Related

- [{{relatedApi}}](./{{relatedApi}}.md)
- [Component Documentation](../components/{{component}}.md)
- [Database Schema](../database/{{model}}.md)

## Changelog

| Date | Version | Changes |
| ---- | ------- | ------- |

{{#changelog}}
| {{date}} | {{version}} | {{changes}} |
{{/changelog}}

---

_Generated: {{timestamp}}_
_Source: {{sourceFile}}_
