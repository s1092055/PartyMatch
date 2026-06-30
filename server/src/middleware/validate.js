export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        message: '請求格式錯誤',
        errors: result.error.flatten().fieldErrors,
      })
    }
    req.body = result.data
    next()
  }
}
