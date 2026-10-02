import re

with open('WorkflowTab.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace approvalRoles state
content = re.sub(r'const \[approvalRoles, setApprovalRoles\] = useState\(\[\]\);', 'const positions = React.useMemo(() => Array.from(new Set(EMPLOYEES.map((e) => e.position).filter(Boolean))).sort(), [EMPLOYEES]);', content)

# Remove roleService useEffect
content = re.sub(r'useEffect\(\(\) => \{\s*roleService\.getAll\(\).*?setApprovalRoles\(\[\]\);\s*\}\);\s*\}, \[\]\);', '', content, flags=re.DOTALL)

# Replace options mapping
content = re.sub(r'\{approvalRoles\.map\(\(r\) => \(\s*<option key=\{r\.id\} value=\{r\.name\}>\{t\(r\.label \|\| r\.name\)\}</option>\s*\)\)\}', '{positions.map((p) => (<option key={p} value={p}>{t(p)}</option>))}', content)

# Replace makeStep arg
content = content.replace('makeStep({ track: block, name: \'Bước duyệt mới\' }, approvalRoles, EMPLOYEES)', 'makeStep({ track: block, name: \'Bước duyệt mới\' }, positions, EMPLOYEES)')

# Remove approvalRoles from Modal props
content = content.replace('approvalRoles={approvalRoles}', '')
content = content.replace('function AdvancedApproverModal({ step, approvalRoles, onConfirm, onClose })', 'function AdvancedApproverModal({ step, onConfirm, onClose })')

with open('WorkflowTab.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
