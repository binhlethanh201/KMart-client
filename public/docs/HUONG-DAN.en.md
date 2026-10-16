# KMart system user guide

> This guide is written for **end users and administrators**. It is split **by role** so you only read
> what you need: staff, approver, HR, administrator.
> Every step states the **menu path** — just follow it and it works.

![The four roles and what each one does](/docs/img/en/so-do-vai-tro.svg)

---

## 0. Which role are you? What to read
<!-- seen-by: all -->

The system has **four role groups**. Your role decides which menus you see and what you can do.

| Role (code) | What you do in the system | Read |
|---|---|---|
| **Staff** (STAFF) | Create your own requests, track progress, supply extra documents, cancel | **1** → **2** → **6** |
| **Approver** (MANAGER · TEAM_LEADER · and other approval roles) | Handle requests that reach you, delegate while away, set a replacement approver | **1** → **3** → **6** |
| **HR** (HR) | Manage employees, reset passwords, departments, view reports | **1** → **4** → **6** |
| **Admin** (ADMIN) | Configure form templates, approval workflows, positions, Telegram, deadlines | **1** → **5** → **6** |

**Shared by every role:** signing in, the mandatory password change, the notification bell and connecting
Telegram (sections **1** and **6**).

> One person can be both staff and approver — in that case also read section **3**; a single account
> handles both sets of work.

> This page only shows the sections your account is allowed to see. Staff do not see the HR and
> administration parts, and vice versa.

### What each menu does

| Menu | What it is for | Who sees it |
|---|---|---|
| **Departments & Groups** | Org chart, department info & members, that department's requests and reports | Everyone |
| **Employee** | Employee list, create accounts, reset passwords, system roles | HR / Admin |
| **Requests → My Requests** | Create requests, track your own, supply extra documents or cancel | Everyone |
| **Requests → Requests Awaiting Me** | Handle requests that reach you: approve, reject, request a supplement, comment | Approvers |
| **Reports** | Overview figures, 12-month trend, breakdown by request type / department, Excel export | HR / Admin |
| **Delegation → Temporary delegation** | Hand approval rights to someone else while you are away | Approvers |
| **Delegation → Approval for overdue replacement** | Set the default replacement approver for requests you approve | Approvers |
| **Settings → Form Templates** | Design request forms and their fields | Admin / HR |
| **Settings → Approval workflow** | Build the approval workflow for each request type | Admin / HR |
| **Settings → Positions & grades** | Manage the positions used as approval checkpoints | Admin / HR |
| **Settings → General & Telegram** | Telegram bot configuration, how overdue hours are counted | Admin / HR |
| **Account** (click your name in the sidebar) | Your profile, connect / change Telegram, edit contact details | Everyone |
| **Guide** | This very page | Everyone |

---

## 1. Shared: signing in, changing password, getting around
<!-- seen-by: all -->

### 1.1. Signing in

Purpose: reach the system with the account HR gave you.

![Four steps: sign in and the mandatory password change](/docs/img/en/dang-nhap.svg)

1. Open the KMart web address — the sign-in screen shows **Work email** and **Password**.
2. Enter your company email + password and click **Sign in** (or press **Enter**).
3. If the details are wrong the error appears **right below the field**; correct it and retry — no reload needed.

**Result:** you land on the main screen for your role.

### 1.2. First sign-in after HR reset your password

If HR has just reset your password the system **blocks** and opens **Mandatory password change**:

1. **Current temporary password** — the temporary password HR gave you (sent on Telegram or read to you).
2. **New password** and **Re-enter the new password** — set your own password.
3. The new password must satisfy **5 conditions** listed right below the field:
   at least **8 characters**, one **uppercase**, one **lowercase**, one **digit**, one **special character**.
4. Click **Change password and continue**. If something is wrong the screen points at the exact field
   (for example "Passwords do not match").

> This screen cannot be skipped — the temporary password gets you into no menu at all.

### 1.3. What you see once inside

![The navigation bar: your details, the notification bell and role-based menus](/docs/img/en/thanh-dieu-huong.svg)

- **Bottom left** (on desktop) shows your **name, role and "Online"** status. Click it (or the avatar) to
  open the **Account** page.
- The **notification bell** sits next to your name. The **red dot** is the number of unread in-app
  notifications; click it to open the list. On **phones** the bell moves to the **top right**.
- The **left menu** only shows what you are allowed to use. Staff, for example, do not see **Employee**,
  **Reports** or **Settings**; approvers also get **Requests Awaiting Me** and **Delegation**.
- The **VI / EN / KO** button on the sign-in screen and inside the app switches the interface language.
- On **narrow screens / phones** long blocks (filters, request details) collapse automatically — tap the
  header row to expand them.

---

## 2. Role: STAFF — sending and tracking your own requests
<!-- seen-by: all -->

### 2.1. Creating a request

Purpose: send a request (leave, overtime, purchase, business trip…) into the approval flow.

![Three steps to create a request](/docs/img/en/tao-don.svg)

Go to **Requests → My Requests** and click **Create new request**. The **Create New Request** dialog opens:

1. **Request type** — pick the type you need. The dynamic form for that type then shows the fields you
   must fill in (for example Start date / End date / Total days for a leave request).
2. **Receiving department** — if you belong to more than one department (primary or secondary) the system
   asks which department receives the request.
3. **Fill in the form** — complete every field marked `*`. Date fields use a built-in calendar picker.
4. **Expected approval flow** — the block at the bottom of the dialog shows who your request will go
   through. Click **Click here to see the flow** for the full diagram: requester → each approval level →
   done, with the **request path** summarised.
5. **Reason / Description** — write a clear reason so the approver can decide quickly.
6. Click **Submit request**.

**Result:** the request becomes **Pending**; the step-1 approver is notified immediately (in-app, plus
Telegram if they connected it).

> The dialog has only two buttons: **Cancel** and **Submit request** — there is no draft button. A request
> is only saved as a **Draft** when attaching a file fails (see 2.4).

#### Checklist before submitting

- Every field marked `*` is filled in, and the dates are the ones you meant.
- Open the flow diagram one last time: right approvers, right number of levels.
- Attach supporting documents (if the type allows) so the approver does not have to ask.

### 2.2. Choosing the approver when step 1 has several candidates

![Three steps for choosing the approver when step 1 has several people](/docs/img/en/chon-nguoi-duyet.svg)

- If step 1 of the workflow has **several possible approvers**, the system **forces** you to pick one in
  the **Choose approver** field. The request is **not** shared with all of them.
- If the workflow already names **exactly one person**, that name is shown and the picker does not appear.
- Wrong approver? That is a **workflow configuration** problem, not your mistake — ask an administrator
  to look at section 5.3.

### 2.3. Tracking requests and the approval flow

![Three steps: status tabs, request card, request details](/docs/img/en/theo-doi-don.svg)

1. Go to **Requests → My Requests**. The status tabs are: **All**, **Pending**, **Supplement needed**,
   **Approved**, **Rejected**. There is a search box and filters by **department** / **request type**.
2. Each card already shows: request type, request code, coloured status badge, **current step / total
   steps** and who is being waited on. Click **Show approval flow details** to open the step diagram
   **inside the list** (the button becomes **Hide approval flow details**).
3. Click a card to open the **details screen**: what you filled in, attachments, the **comment** box
   (type `@` to mention someone) and the **progress** of every level (who approved and when).
4. You are notified **every time the request moves on**: who just approved and who is next.

### 2.4. Supplying extra documents when asked

![Three steps to supply documents and three steps to cancel](/docs/img/en/sua-va-huy-don.svg)

1. A request that needs more documents carries the **Supplement requested** badge in the list, plus a
   Telegram message (if you connected it). The **Supplement needed** tab collects these.
2. Open the request → click **Supplement** → the **Supply extra documents** dialog opens → update the
   fields / files the approver asked for.
3. Click **Supplement & resubmit**.

**Result:** the request returns to **Pending** at **exactly the step it was on** (it does not start over);
the approver of that step is notified.

> **Attachment upload failed:** the system still saves the request as a **Draft** and asks what to do:
> **Stay and edit** · **Retry upload** · **Send without files**. A request is never submitted silently
> without its documents.

### 2.5. Cancelling a request

**You can only cancel before anyone has approved.** The **Cancel request** button only appears while the
request is **Pending** / **Supplement needed** / **Draft** and you are the requester. Once anyone has
approved a step the button disappears.

1. Open the request → click **Cancel request**.
2. The **Cancel this request?** dialog appears: type a **cancel reason** — it is **optional** (up to 1000
   characters) but worth writing so approvers understand.
3. Click **Confirm cancel** (or **Keep request** to back out). This **cannot be undone**.

**Result:** the request becomes **Cancelled**. Anyone waiting to approve it is also notified.

### 2.6. Notifications

![Two notification channels: the in-app bell and Telegram](/docs/img/en/thong-bao.svg)

- **In the web app:** the bell in the sidebar (desktop) or top right (phone). The **red dot** is the
  number of unread notifications; click a row to open the right page.
- **Telegram** (if connected): every request event — your turn to approve, deadline approaching, overdue
  handover, approved / rejected / supplement requested, cancelled — with a **View details** link that
  opens the request page directly. Temporary passwords from HR also arrive here.

To connect Telegram see section **6**.

---

## 3. Role: APPROVER — handling requests that reach you
<!-- seen-by: approver -->

### 3.1. The approval queue

![Three steps to open the queue and act on a request](/docs/img/en/hang-cho-duyet.svg)

1. Go to **Requests → Requests Awaiting Me**.
2. The list contains requests **waiting on you** and requests **delegated to you** while a delegation is
   in effect.
3. Each card shows the form, the requester, the current step and the **time left before the deadline**.
4. Click a card to open it: the completed form, attachments, history and progress.

**Fastest route:** click the **View details** link in the Telegram message to open the request directly.

### 3.2. The three actions on a request

![The three approver actions: approve, reject, request a supplement](/docs/img/en/thao-tac-duyet.svg)

| Action | Condition | Result |
|---|---|---|
| **Approve request** | Nothing else to write | The request moves to the **next step**; on the last step it becomes **Approved**. Requester and next approver are notified. |
| **Reject** | **A reason is mandatory** — an empty box blocks submitting (up to 1000 characters) | The request becomes **Rejected**; the requester receives your **reason**. |
| **Request a supplement** | **You must state exactly what is needed** | The request becomes **Supplement requested** and goes back to the requester, **staying on the same step**; you approve again after they resubmit. |

> A step has only these **three** actions. There is no "forward to another approver" and no "edit the
> request for the requester".
>
> The rejection reason is **always mandatory** — the system does not let you disable that rule.

### 3.3. Comments and mentioning people

![Type @ in the comment box to mention someone](/docs/img/en/binh-luan.svg)

- The details screen has a **comment** box for talking to the requester and other levels.
- Type `@` to open the user list and mention someone — they get a **"New comment"** notification.
- Comments appear in the request progress section and **every approval level can read them**.

**Tip:** use a comment to ask for clarification instead of rejecting straight away. If the requester can
add what is missing, the request moves on much faster.

### 3.4. Temporary delegation while you are away

Purpose: take long leave without requests piling up.

![Three steps to create a temporary delegation](/docs/img/en/uy-quyen-tam-thoi.svg)

1. Go to **Delegation → Temporary delegation** and click **Create delegation**.
2. Fill in **3 mandatory fields**: **the delegate** · the **date range** · the **reason**.
3. While it is in effect, requests meant for you are handled by **the delegate**, and the system states
   **"approving for whom"**.

End it early at any time with **Change person** or **Revoke**. When the period ends the right returns to
you automatically.

### 3.5. Setting a replacement approver for overdue requests

Purpose: when you let a request go overdue, the system hands it to someone you trust instead of cancelling it.

![Three steps to set the default replacement approver](/docs/img/en/duyet-thay-qua-han.svg)

1. Go to **Delegation → Approval for overdue replacement**.
2. Click **Set a delegated approver** (or **Change person** if already set), pick someone and click
   **Save delegated approver**.
3. When a request you approve goes overdue and the step uses **"Approve via overdue delegation"**, the
   request moves to that person with a fresh time window.

**Worth knowing:**

- Each person can set only **one** replacement approver; saving again **overwrites** the old setting.
- The setting applies to **every request you approve**, not per approval level.
- With **nothing set**, your overdue requests are **cancelled**.
- Every overdue handover is written to the **audit log**.

### 3.6. What happens when a request goes overdue

![How one approval step behaves over time](/docs/img/en/qua-han.svg)

**Before the deadline:** the current approver gets **"Approval deadline approaching"** with a link to the request.

> The system reminds **exactly once per step** and does not repeat — that is deliberate anti-spam
> behaviour. A new reminder only comes when the request moves to a **new step**.

**Overdue with no action:** the system acts by itself, per the step's configured action. There are **2**:

1. **Return the request to the originator** — it goes back to the requester.
2. **Approve via overdue delegation** — it moves to the **replacement approver** that step's approver set
   on **Approval for overdue replacement** (section 3.5).

**Overdue a second time:** if the replacement approver **also** lets it go overdue the request is
**cancelled** and returned to the requester. No replacement approver configured means the same.

The people involved get Telegram messages: **"Overdue request handed to a delegated approver"** or
**"The request was cancelled and returned to you"**.

> "Auto-escalate to **the level above**" **does not exist** in the step configuration screen. If the
> business needs it, ask an administrator — see section 5.4.

---

## 4. Role: HR — managing people and accounts
<!-- seen-by: hr-admin -->

### 4.1. Viewing, searching and filtering employees

![Three steps on the Employee screen](/docs/img/en/nhan-su.svg)

1. Go to the **Employee** menu: the employee list with a search box (name, employee code, email…) and
   filters by **department** / **account status**.
2. Click an employee to open the **full profile**: contact details, department – primary position,
   **secondary** positions, system role, and **position history** over time.
3. When someone leaves, click **Lock account** in the profile — the status becomes **Inactive**.

> There is **no "delete employee"** action. Accounts are only **locked**, so existing requests and
> approval history stay intact. A locked account cannot sign in but still appears in past reports.

### 4.2. Creating an employee account and putting them in a department

![Five steps to create a new employee account](/docs/img/en/tao-tai-khoan.svg)

1. On the **Employee** screen click **Create employee account** — the create form opens.
2. Fill in **Full name**, **Work email** (used to sign in) and **Phone number**.
3. Choose the **Department** and the **Primary position** — **this is the step that puts the employee in a
   department**. For several positions click **+ Add a secondary position** and mark which one is **Primary**.
4. Choose the **system role**, which decides their menu and permissions. The usual roles are
   **STAFF** · **TEAM_LEADER** · **MANAGER** · **HR** · **ADMIN**.
   > The list comes from the system, so it may contain more roles (Director, Supervisor, Board…) depending
   > on your configuration.
5. Click **Save** — the system creates the account with a **temporary password** shown for you to read
   out; the employee **must change it on their first sign-in**.

### 4.3. Resetting a password for an employee who forgot theirs

![Three steps to reset an employee password](/docs/img/en/dat-lai-mat-khau.svg)

1. Go to **Employee** → open the employee profile → click **Reset password** (only shown while the
   account is active; a locked account must be unlocked first).
2. The system **generates a temporary password** — you do not type one. It appears **on the HR screen**
   and is **sent to the employee's Telegram** (if they connected).
3. The employee signs in with their email + temporary password and is **forced to change it immediately**
   (section 1.2).

### 4.4. Departments & Groups

![The org chart and how to add a member to a department](/docs/img/en/phong-ban-nhom.svg)

- The **Departments & Groups** menu shows the multi-level **org chart** (Board → Department → Group) and
  business groups. Every role can view it.
- Click a department to see its members, its requests and **reports for that department**.
- To add a member: open the department / group card → in the member table click add → pick the employee →
  set **Primary / Secondary** per position. **The direct manager used by the approval flow is derived from
  this very position field.**
- To move someone to another department: edit the position on the **Employee** screen, or remove them from
  the group and add them to a new one.

### 4.5. Reports and Excel export

![The reports page and Excel export](/docs/img/en/bao-cao.svg)

1. Go to the **Reports** menu (HR / Admin permission).
2. Use the filter bar: **date range**, **block**, **department**, **request type**, **position**. On phones
   tap the **Filter** row to expand / collapse the filter area.
3. The blocks are: overview cards, **12-month trend** (switch between **Combined** / **By request type**),
   distribution by request type & department, department / position comparison, and the executive table.
4. Click the **Excel** button on any table to export **exactly what you are looking at**, or click
   **Export report** for finer control over the range.
5. The detail table lets you **open each row** for a single request.

---

## 5. Role: ADMIN — configuring the system
<!-- seen-by: hr-admin -->

> The right order when adding a new request type:
> **5.1 Form template** → **5.2 Positions** (if missing) → **5.3 Workflow** → **5.4 overdue settings**
> → test with **one real request** → check the Telegram notification.

### 5.1. Form Templates

![Three steps to create a form template and compose its fields](/docs/img/en/mau-don.svg)

1. Go to **Settings → Form Templates** and create a template: **name**, **code**, **template group**.
2. Click the **pen** icon on the template card to open the field composer.
3. Add a field: pick one of the **6 field types** — **Text** · **Number** · **Choice**
   (dropdown / radio / checkbox) · **Date** · **File upload** · **Delegated approver**. Name the field and
   mark it **required** if needed (required fields show a `*` to the requester).
4. With the **File upload** type you can attach a **printable form template** for employees.
5. **Drag to reorder** the fields and save. The new form only applies to **requests created afterwards** —
   existing requests keep their content.

> **A template without a workflow cannot be used yet.** Continue with section 5.3.
>
> **Technical note:** the interface **does not let you set a "key" for a field** (the key is generated
> automatically). Conditional branching on **leave type** or **OT hours** therefore **cannot be configured
> in the interface today** — see the note in section 5.3.

### 5.2. Positions & grades

![The grade ladder used as approval checkpoints, and one person with several positions](/docs/img/en/chuc-vu.svg)

- Go to **Settings → Positions & grades** to declare the positions used as **approval checkpoints**:
  Shift Leader, Team Leader, Deputy head, **Department head**, **Store Manager**, Branch manager,
  Area manager, Division Director…
- The **Retail** block uses a different set of checkpoints from the **Office** block. A wrong position
  here makes the workflow pick **the wrong person** — check before going live.
- One employee can hold **several positions** (primary + secondary). A workflow based on "direct manager"
  takes the manager from the employee's **PRIMARY** position.

### 5.3. Approval workflow per request type

![A multi-level approval flow](/docs/img/en/luong-duyet.svg)

Go to **Settings → Approval workflow**. **Each request type has its own workflow**, used only for the
**Office** block, only for the **Retail** block, or **shared** by both. A workflow is a list of ordered
**approval steps**.

1. Pick the **form template** in the selector at the top.
2. Click **Add next approval step** and configure that step.
3. Click **Save workflow settings**.

#### The four groups of settings on a step

![The four groups of settings on one approval step](/docs/img/en/luong-duyet-4-nhom.svg)

**(A) Approval type — who approves this step.** Pick one of 4:

| Type | Meaning | When to use |
|---|---|---|
| **Direct manager** | The requester's direct manager approves | The standard department flow |
| **Management chain** | Approved level by level from low to high | Requests needing several management signatures |
| **Arranged approvers** | Pick an approval rule + a position or a specific group | Flows customised by position |
| **Name exactly 1 person** | The request goes to that one person only | Special requests with a fixed owner |

With "Direct manager" you choose the checkpoint: **direct manager / deputy head / department head**.
With "Management chain" you choose the **first and last level**. With "Arranged approvers" you choose a
**position** or a **specific group of people**.

**(B) Rule when several people approve** (only for the "Arranged approvers" type):

- **Sequential**: each person approves before the next one (shown as `A ➔ B ➔ C`). The full ordered list is
  required — the system reports each step missing data.
- **Parallel — all must agree**: sent to everyone; the step only passes on **100%** approval.
- **Parallel — any one approves**: the step passes as soon as **one** person approves.

**(C) Overdue handling** (in detail in section 5.4):

- Turn on **Auto-handle the request when the deadline passes** and enter the **hours** allowed (12 by default).
- Choose the **time-counting mode**: 12 continuous hours day and night, or **office hours only**.
- Choose the **action**: **Return the request to the originator** or **Approve via overdue delegation**.

**(D) Step order & scope:**

- **Drag to reorder steps**; flip the switch to **disable** a step you do not use.
- **Scope**: auto by the employee's workplace, **Office** only, **Retail** only, or **shared**.
- **Rejection reason mandatory**: this rule is **always on** and fixed in the system.

#### Checking the workflow you just built

- Click **Save** — the system validates the configuration (for example a "Sequential" step with nobody
  selected) and reports **which step** is missing what.
- Test with **one real request**: open **Create new request**, pick the type you just configured and check
  the **Expected approval flow** block — the diagram must show the people / levels you set.
- **Editing a workflow only affects new requests.** Running requests keep the workflow from the moment they
  were submitted.

> **⚠️ Conditional steps are not configurable in the interface yet.**
> The system **does** support a step that only runs when the request meets a condition: comparing
> **leave days**, **leave type** or **OT hours** with `>` `>=` `=` `<=` `<` (for example: the Director step
> only runs when leave days are greater than 3). That mechanism **has no configuration screen in the app
> today**, and the interface does not let you set a field "key" either (section 5.1). Ask the engineering
> team to configure it through the API.

### 5.4. Overdue handling and the replacement approver

![The two paths when a step goes overdue, and the global time-counting default](/docs/img/en/xu-ly-qua-han.svg)

**a) Overdue settings per approval step** — on **Settings → Approval workflow**, in the step's
**Overdue handling** group (section 5.3, group C). There are only **2 actions**:

| Action | What the system does |
|---|---|
| **Return the request to the originator** | The request goes back to the requester, who gets "the approval deadline passed". |
| **Approve via overdue delegation** | The request moves to the **replacement approver** that this step's approver set on **Delegation → Approval for overdue replacement** (section 3.5). |

If the replacement approver **also** goes overdue — or the approver **never set** one — the request is
**cancelled** and returned to the requester.

> **Note:** "auto-escalate to **the level above**" **no longer exists** in the step configuration screen.
> If the business requires escalation, add an extra **approval step** at the higher level instead of
> relying on an overdue action.

**b) System-wide default time-counting mode** — in **Settings → General & Telegram**, block
**How the 12 overdue hours are counted**: choose **12 continuous hours** (day and night) or **Mon → Fri
office hours only** (skipping weekends and holidays), together with the office **start / end hours**.
Each approval step can override this rule.

### 5.5. Configuring the Telegram bot

![The Telegram Bot block on the Settings screen, with two other general blocks](/docs/img/en/cau-hinh-he-thong.svg)

1. Go to **Settings → General & Telegram**, block **Telegram Bot integration**.
2. The **Telegram Bot Token** field keeps the current token (shown as dots for security). Paste a new
   token from **@BotFather** on Telegram if you need to change it.
3. Click **Save settings**: the system calls Telegram to **verify the bot token** and **re-registers the
   incoming-message route** (webhook) pointing at the current server — **https is required**.
4. The status label in the card corner confirms it: **Connected** (green) or **Not connected**. On
   failure a red message names the cause: wrong bot token, Telegram unreachable, or a webhook URL missing https.

**Note:** after switching to a new bot, users **do not have to reconnect** — existing chat bindings stay.

> There is **no "send a test message"** button here. To test the channel, submit **a real request**
> (section 2.1) or click **Connect Telegram** on the **Account** page (section 6).

---

## 6. Telegram: connecting and receiving notifications
<!-- seen-by: all -->

### 6.1. Connecting for the first time

![Connect Telegram and receive notifications](/docs/img/en/telegram.svg)

1. Open the **Account** page: click **your name bottom left** (sidebar) or the avatar.
2. On the notification-bell row, if you are not connected you will see **Connect Telegram** — click it and
   the system opens Telegram with the company bot.
3. In Telegram press **Start** — the bot replies **"Connected successfully!"** and you are done.
4. Back in the web app, **reload the page** — the bell row turns green: **"Telegram connected"**.

**About the connect link:**

- The link lives for **15 minutes** and is **single use**. Reusing an old link gives
  **"Link invalid or expired"** — go back to the web app and click **Connect Telegram** for a new one.
- The **Account** page **does not refresh by itself** — you must **reload the page** after pressing Start
  in Telegram.

### 6.2. Switching to another Telegram account

On the **Account** page, next to **Telegram connected**, click **Change Telegram connection** → open the
bot link and press **Start with the new account**. **The old connection is replaced automatically.**

### 6.3. What you receive

- Your requests **approved** / **rejected** / **supplement requested** / **cancelled**.
- A **new request awaiting your approval**, an **approaching deadline**, an **overdue handover** or a
  **cancellation**.
- The **temporary password** when HR resets your password.
- A **new comment** or when you are **mentioned** with `@` on a request.
- Every message carries a **View details** link that opens the right page; request and person names are
  **in bold**.

---

## 7. Frequently asked questions
<!-- seen-by: all -->

**Q: Why does the flow diagram show the word "Approver" instead of a name?**
A: With a "name exactly one person" flow, or a flow with several candidates, names only appear once the
system or you have picked someone. Choose a person in the **Choose approver** field and reopen the diagram.
If it is still wrong, ask an administrator to check the workflow (section 5.3).

**Q: I am not getting Telegram messages.**
A: Check that the **Account** page shows **Telegram connected** (reload the page first); if not, reconnect
(section 6.1). If you are connected and still receive nothing, ask an administrator to check the bot
configuration (section 5.5).

**Q: A user pressed Start but never saw "Connected successfully".**
A: Check the **Connected** label in **Settings → General & Telegram** (is the bot token still valid) and
click **Save settings** to re-register the incoming route. Or the link expired after 15 minutes — click
**Connect Telegram** on the **Account** page for a new one.

**Q: Why is the approver reminded about the deadline only once?**
A: That is deliberate anti-spam behaviour. The system only reminds again when the request moves to a **new
approval step**.

**Q: A request I was approving disappeared from the queue.**
A: It may have been **cancelled by the requester**, **handed to someone else because it went overdue**, or
**handled by another approver at the same level** under the "any one approves" rule.

**Q: I forgot my password.**
A: Ask **HR to reset it** (section 4.3). You receive a temporary password on Telegram or in person, sign in
and are **forced to change it immediately** (section 1.2).

**Q: Times in logs or the database are 7 hours off the screen.**
A: The system **stores UTC** and the interface **shows your machine's local time (GMT+7)**. That is by
design, not a bug.

**Q: How do I add one more approval level?**
A: Go to **Settings → Approval workflow**, pick the right form template, click **Add next approval step**
and configure the approval type for the new step (section 5.3).

**Q: What does it take to add a new request type?**
A: Create the **form template + fields** (section 5.1) → create its **workflow** with steps (section 5.3)
→ **test with one real request** → **check the Telegram notification** (section 6).

**Q: Does editing a workflow affect running requests?**
A: **No.** A request keeps the workflow from the moment it was submitted; the new workflow applies only to
requests created afterwards.

---

## Appendix A. Which role sees which menu
<!-- seen-by: all -->

| Menu | Staff | Approver | HR | Admin |
|---|:--:|:--:|:--:|:--:|
| Departments & Groups | ✅ | ✅ | ✅ | ✅ |
| Requests → My Requests | ✅ | ✅ | ✅ | ✅ |
| Requests → Requests Awaiting Me | ❌ | ✅ | ✅ | ✅ |
| Delegation (Temporary delegation · Approval for overdue replacement) | ❌ | ✅ | ✅ | ✅ |
| Employee | ❌ | ❌ | ✅ | ✅ |
| Reports | ❌ | ❌ | ✅ | ✅ |
| Settings | ❌ | ❌ | ✅ | ✅ |
| Guide | ✅ | ✅ | ✅ | ✅ |
| Account (click your name) | ✅ | ✅ | ✅ | ✅ |

## Appendix B. Request statuses and badge colours
<!-- seen-by: all -->

| Badge on the card | Meaning | Colour |
|---|---|---|
| **Draft** | Not submitted (only happens when a file upload failed) | Grey |
| **Sent (Pending)** / **Pending approval** | Waiting for someone to approve | Amber |
| **Supplement requested** | The approver needs more from you — the request stays on the same step | Purple |
| **Approved** | All approval steps are done | Green |
| **Rejected / Returned** | Rejected, or returned because it went overdue | Red |
| **Cancelled** | Cancelled by the requester, or cancelled by the system after two overdues | Dark grey |

> The filter tabs use shorter labels: **All · Pending · Supplement needed · Approved · Rejected**.

## Appendix C. Actions that do NOT exist
<!-- seen-by: all -->

Do not waste time looking for these buttons — they are not there:

- **Saving a request as a draft** in the create dialog (only **Cancel** and **Submit request**).
- **Sending a test message** on the Telegram settings screen.
- A button called **"Check & save connection"** — the real one is **Save settings**.
- **Escalating an overdue request to the level above** — the interface has only 2 actions (section 5.4).
- **Configuring conditional steps** based on leave days / leave type / OT hours (section 5.3).
- **A replacement approver per approval level** — only one person for all requests you approve.
- **Deleting an employee** — you can only **lock the account**.
- **Typing a new password for an employee** — the system generates a temporary one.
- A screen called **"Job titles"** — the real menu is **Settings → Positions & grades**.
- A screen called **"Form templates"** at the top level — it is **Settings → Form Templates**.

---

*KMart — Software User Guides*
