import re

with open('src/context/ApprovalSystemProvider.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace in approve
content = re.sub(r'(const updated = await applicationService\.approve\(reqId\);\s*)setRequests\(\(list\) => list\.map\(\(r\) => \(r\.id === reqId \? \{ \.\.\.updated, _isPendingReq: r\._isPendingReq \} : r\)\)\);', r'\1setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: false } : r)));', content)

# Replace in reject
content = re.sub(r'(const updated = await applicationService\.reject\(reqId, reason\);\s*)setRequests\(\(list\) => list\.map\(\(r\) => \(r\.id === reqId \? \{ \.\.\.updated, _isPendingReq: r\._isPendingReq \} : r\)\)\);', r'\1setRequests((list) => list.map((r) => (r.id === reqId ? { ...updated, _isPendingReq: false } : r)));', content)

with open('src/context/ApprovalSystemProvider.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
