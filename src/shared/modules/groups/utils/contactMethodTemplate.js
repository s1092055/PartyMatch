export const CONTACT_METHOD_META = {
  line: {
    label: "LINE / 私訊",
    description: "最適合台灣常見的小型共享團。",
    fieldLabel: "LINE ID",
    hint: "請填入你的 LINE ID，方便團主加你為好友確認細節。",
    placeholder: "例：your_line_id",
    prefix: "LINE ID：",
  },
  discord: {
    label: "Discord / 社群",
    description: "適合遊戲、創作者或長期經營的群組。",
    fieldLabel: "Discord 用戶名",
    hint: "請填入 Discord 用戶名（含 # 數字），方便加入群組伺服器。",
    placeholder: "例：username#1234",
    prefix: "Discord：",
  },
  email: {
    label: "Email / 表單",
    description: "適合資訊要留下書面紀錄的共享流程。",
    fieldLabel: "Email 地址",
    hint: "請填入常用的 Email 地址，方便團主寄送確認信。",
    placeholder: "例：yourmail@example.com",
    prefix: "Email：",
  },
};

export function resolveContactMethodValue(contactMethod) {
  if (typeof contactMethod === "string") {
    return contactMethod.trim();
  }

  if (contactMethod && typeof contactMethod === "object") {
    if (typeof contactMethod.type === "string" && contactMethod.type.trim()) {
      return contactMethod.type.trim();
    }

    if (typeof contactMethod.value === "string" && contactMethod.value.trim()) {
      return contactMethod.value.trim();
    }
  }

  return "";
}

export function buildContactMethodTemplate(type) {
  const resolvedType = resolveContactMethodValue(type);
  const meta = CONTACT_METHOD_META[resolvedType];

  if (!meta) {
    return {
      type: "",
      label: "",
      value: "",
      fieldLabel: "",
      hint: "",
      placeholder: "",
      prefix: "",
    };
  }

  return {
    type: resolvedType,
    label: meta.label,
    value: resolvedType,
    fieldLabel: meta.fieldLabel,
    hint: meta.hint,
    placeholder: meta.placeholder,
    prefix: meta.prefix,
  };
}

export function resolveContactMethodTemplate(template, fallbackType = "") {
  const resolvedType =
    resolveContactMethodValue(template) || resolveContactMethodValue(fallbackType);
  const baseTemplate = buildContactMethodTemplate(resolvedType);

  if (!template || typeof template !== "object") {
    return baseTemplate;
  }

  return {
    ...baseTemplate,
    ...template,
    type: resolvedType,
    value: resolvedType,
    label:
      typeof template.label === "string" && template.label.trim()
        ? template.label.trim()
        : baseTemplate.label,
    fieldLabel:
      typeof template.fieldLabel === "string" && template.fieldLabel.trim()
        ? template.fieldLabel.trim()
        : baseTemplate.fieldLabel,
    hint:
      typeof template.hint === "string"
        ? template.hint
        : baseTemplate.hint,
    placeholder:
      typeof template.placeholder === "string"
        ? template.placeholder
        : baseTemplate.placeholder,
    prefix:
      typeof template.prefix === "string"
        ? template.prefix
        : baseTemplate.prefix,
  };
}
