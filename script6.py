import re

with open(r'c:\Users\duyan\OneDrive\Desktop\Kmart-Du an\Kmart\src\features\system-config\components\WorkflowTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'if \(wfId\) \{\s*await workflowService\.update\(wfId, req\);\s*\} else if \(req\.steps\.length > 0\) \{'
replacement = r'''if (wfId) {
            const updated = await workflowService.update(wfId, req);
            if (updated && updated.id && updated.id !== wfId) {
              setWorkflowIds(prev => ({ ...prev, [${formType}_]: updated.id }));
            }
          } else if (req.steps.length > 0) {'''
content = re.sub(pattern, replacement, content)

with open(r'c:\Users\duyan\OneDrive\Desktop\Kmart-Du an\Kmart\src\features\system-config\components\WorkflowTab.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
