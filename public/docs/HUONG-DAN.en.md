# KMart System User Guide

> A handbook for **end users and administrators**: creating requests, approving, configuring approval
> flows, using Telegram, delegation and reports. Every section names the exact menu path so you can
> follow along click by click.

---

## 1. Quick start

- **Sign in** with your company email and the password issued by HR.
- The main menu on the left includes: **Departments & Groups**, **Personnel**, **Requests**,
  **Reports**, **Delegation**, **Settings**, **Guide** (some items appear only for your role).
- The **VI / EN / KO** buttons switch the interface language.
- The bell at the top right shows **in-app notifications**; important ones are also pushed to
  **Telegram** if you are connected.

### First sign-in after a password reset

If HR just reset your password, the system opens the **Mandatory password change** screen:

1. **Current temporary password**: enter the temporary password HR issued (via Telegram or in person).
2. **New password** and **Re-enter new password**: set your new password.
3. The new password must meet the 5 rules shown under the field: at least 8 characters, an uppercase
   letter, a lowercase letter, a digit and a special character.
4. Press **Change password and continue** to enter the system. Wrong input shows a specific error
   right under the related field (e.g. "Confirmation password does not match").

---

## Feature overview by menu

The table summarises what each menu item does and who sees it, so you know where to go:

| Menu | What it does | Who sees it |
|---|---|---|
| **Departments & Groups** | Org chart, department info & members, requests inside a department | Everyone |
| **Personnel** | Employee list, create accounts, reset passwords, assign roles | HR / Admin |
| **Requests → My requests** | Create a request, track your own, supplement or cancel it | Everyone |
| **Requests → Waiting for my approval** | Process requests assigned to you: approve, reject, request info, comment | Approvers |
| **Reports** | Overview metrics, 12-month trend, breakdown by type/department, Excel export | HR / Admin |
| **Delegation → Temporary delegation** | Hand your approval right to someone while you are away | Approvers |
| **Delegation → Overdue substitute** | Set the default substitute when your requests time out | Approvers |
| **Settings → Forms / Workflows / Positions** | Design request forms, build approval flows, manage positions | Admin |
| **Settings → General & Telegram** | Telegram bot token, webhook, system parameters | Admin |
| **Profile** (click your name) | Personal profile, connect / change Telegram, edit contact info | Everyone |
| **Guide** | This documentation page | Everyone |

**Reading tips by role:** new staff only need sections 1–3; approvers add 3.2 and 6; administrators
study 4 and 5.4; HR reads 7.

---

## 2. Create a new request (step-by-step)

![Three steps to create a request](/docs/img/tao-don.svg)

Open **Requests → My requests** and press **Create new request**. The **Create New Request** dialog opens:

1. **Request type**: pick the type you need (leave, overtime, purchase, business trip...). The dynamic
   form for that type then shows the required fields (e.g. From date / To date / Total days for leave).
2. **Fill the form**: complete every field marked `*`. Dates use the built-in picker.
3. **Preview the approval flow**: the **Expected approval flow** block at the bottom shows who the
   request will pass through. Press **Click here for flow details** (or **View flow details**) for the
   full diagram: sender → each approval level → done, plus the **Request path** summary line.
4. **Designated approver**: if step 1 has several possible approvers you must pick one in
   **Choose approver**. If the flow designates a single person, their name is shown and no choice is needed.
5. **Reason / Description**: explain clearly so approvers can decide fast.
6. Press **Submit request**. The request becomes pending and the level-1 approver is notified
   immediately (in-app + Telegram).

**Tip:** before submitting, open the flow diagram to confirm the request reaches the right person; a
wrong approver means the flow configuration is off — ask an administrator (section 4).

### Double-check before submitting

- All `*` fields filled; dates match the period you actually need.
- Open the flow diagram one last time: right approver, right number of levels.
- Attach supporting documents (if the type allows) so approvers don't have to ask.

### What happens after submitting

- The request moves to the **Waiting** tab; the level-1 approver is notified instantly.
- You get a notification each time the request advances: who approved and who is next.
- In a hurry? Ping the approver directly or via Telegram; the system also reminds them before deadlines.

---

## 3. Track and process requests

### 3.1 As the sender

- Open **Requests → My requests**. Status tabs: **All**, **Waiting**, **Needs supplement**.
- Click a request for details: current step, who approved, who is next, history and comments.
- If **supplement requested**: open the request, add the requested info and resubmit.
- To withdraw: press **Cancel request** and give a reason.

### 3.2 As an approver

- Open **Requests → Waiting for my approval** (or press **View details** in a notification/Telegram
  message to jump straight to the request).
- The detail view offers three main actions:
  - **Approve**: the request moves to the next step, or finishes at the last step.
  - **Reject**: a reason is required; the sender is notified with it.
  - **Request supplement**: state clearly what is missing; the request returns to the sender.
- You can add **comments** to discuss with the sender and other approvers.
- Telegram messages always state: request type, sender, and (from step 2 on) a **Progress** line
  listing which step was approved by whom. Press **View details** in the message to open that request.

### Tips when many requests pile up

- Open requests via the Telegram **View details** link instead of scrolling the list.
- Requests close to deadline get their own reminder — handle those first.
- Use **comments** to ask instead of rejecting early; a quick supplement keeps the flow moving.
- Away for long? Set a **temporary delegation** (section 6) so requests don't stall.

---

## 4. Configure an approval flow per request type — administrators

![Multi-level approval flow](/docs/img/luong-duyet.svg)

Open **Settings → Workflows**. Each request type has a flow made of ordered **approval steps**.
Press **Add next approval step** to add one.

### 4.1 Choose the approval mode of a step

Each step has an **Approval mode** with four options:

| Mode | Meaning | When to use |
|---|---|---|
| **Direct manager** | The sender's direct manager approves | Standard department flow |
| **Management chain** | Approve from lower to higher management levels | Requests needing several management signatures |
| **Arranged approval** | Pick a rule plus titles or a group of people | Custom flows by title |
| **One specific person** | The request goes to exactly one chosen person | Specialised requests with a fixed owner |

### 4.2 Rules when a step has several approvers

- **Sequential**: each person approves only after the previous one (`A ➔ B ➔ C`). You must pick the
  ordered list of approvers.
- **Parallel — all must agree**: sent to everyone; advances only when 100% approve.
- **Parallel — any one**: whoever approves first moves the request on.

### 4.3 Timeout handling for a step

Enable the **Timeout handling** group and enter the allowed **hours**. When time runs out the system
automatically applies the action you chose:

- **Return to creator**: the request goes back to the sender.
- **Approve via overdue delegation**: the request moves to the substitute the approver configured
  (see section 6).
- Or escalate upward, depending on step configuration.

### 4.4 Save and verify

- Press **Save** when done. The system validates the configuration (e.g. a "sequential" step without
  approvers) and reports exactly what each step is missing.
- To test: open **Create new request**, pick the type you configured and look at the
  **Expected approval flow** block — the diagram must match what you just set.

---

## 5. Connect and use Telegram

![Telegram connection and notifications](/docs/img/telegram.svg)

### 5.1 First connection

1. Open your **Profile** page (click your name at the top left → Profile).
2. Press **Connect Telegram**. The company bot opens in Telegram.
3. Press **Start** in Telegram. The bot replies "Connection successful!" and you will receive request
   notifications there from now on.

### 5.2 Switch to another Telegram account

- On the **Profile** page, next to **Telegram connected**, press **Change Telegram connection**.
- Open the bot link and press **Start with the new account**; the old connection is replaced.

### 5.3 What you receive

- Your request approved / rejected / needs supplement / cancelled.
- A new request waiting for you, a request close to deadline, an overdue request moved or cancelled.
- The temporary password when HR resets your password.
- Every message has a **View details** link opening the exact page; request and person names are
  **bold** for readability.

### 5.4 For administrators: bot configuration

Open **Settings → General & Telegram**: paste the **Bot Token**, test the connection, then register
the webhook so the bot receives Start commands. Without bot configuration, users get an error when
connecting and only in-app notifications work.

---

## 6. Delegation and overdue substitute

Open the **Delegation** menu, which has two pages:

### 6.1 Temporary delegation (when you are away)

1. Press **Create delegation**, choose the delegate and the effective period.
2. During that period, requests meant for you go to the delegate; the system records "approved on
   behalf of" whom.
3. When the period ends the right returns to you. You can **Change person** or **Revoke** any time.

### 6.2 Overdue substitute (default setting)

1. Open **Delegation → Overdue substitute**.
2. Choose the default substitute and press **Save substitute**.
3. When a request you approve times out and the flow enables "approve via overdue delegation", it
   moves to this person. Without it, overdue requests are cancelled/returned per flow configuration.

---

## 7. For HR

- **Create an employee account**: **Personnel → Create employee account**, fill name, email,
  department, role. The employee receives a temporary password and must change it at first sign-in.
- **Reset a password**: open the employee profile → **Reset password**. The system generates a
  temporary password, shows it to HR **and sends it straight to the employee's Telegram** (if connected).
- **Assign roles**: set ADMIN / HR / MANAGER / TEAM_LEADER / STAFF to limit menus and permissions.

---

## 8. Reports and Excel export

![Reports page and Excel export](/docs/img/bao-cao.svg)

- Open **Reports** (HR/ADMIN permission).
- Use the filter bar (date range, block, department, request type, position) to narrow the data.
  On phones, tap the **Filter** row to collapse/expand the filter area.
- Metric blocks: overview, 12-month trend (switch **Aggregate** / **By request type**), breakdown by
  type & department, department / position comparison, management roster.
- Each table has an **Excel** button exporting exactly what you see.

---

## 9. Frequently asked questions (FAQ)

**Q: Why does the flow diagram show "Approver" instead of a name?**
A: For "one specific person" flows or flows with several candidates, the name appears once the system
or you has chosen someone. Pick in **Choose approver** and reopen the diagram. If still wrong, ask an
administrator to check the flow (section 4).

**Q: I don't get Telegram messages?**
A: Check your **Profile** shows **Telegram connected**; reconnect if not. If connected but silent, ask
an administrator to check the bot configuration (section 5.4).

**Q: A request I should approve disappeared from my queue?**
A: It may have been cancelled by the sender, moved on timeout, or already handled by a co-approver
(under the "any one approves" rule).

**Q: Forgot my password?**
A: Ask HR to reset it (section 7). You receive a temporary password via Telegram or in person, sign in
and must change it immediately (section 1).

**Q: How do I add another approval level to a request type?**
A: An administrator opens **Settings → Workflows**, opens that type's flow and presses
**Add next approval step**, then configures the new step's approval mode (section 4).
