<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$branchId = getBranchId();
$success = $_GET['success'] ?? '';
$error = $_GET['error'] ?? '';

$membersList = $db->prepare("SELECT id, first_name, last_name, phone FROM members WHERE branch_id = ? ORDER BY first_name");
$membersList->execute([$branchId]);
$membersList = $membersList->fetchAll();

$comms = $db->prepare("SELECT c.*, m.first_name, m.last_name FROM communications c LEFT JOIN members m ON c.member_id = m.id WHERE c.branch_id = ? ORDER BY c.created_at DESC LIMIT 50");
$comms->execute([$branchId]);
$communications = $comms->fetchAll();

$annStmt = $db->prepare("SELECT a.*, u.first_name, u.last_name FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.branch_id = ? ORDER BY a.created_at DESC");
$annStmt->execute([$branchId]);
$announcements = $annStmt->fetchAll();
?>
<?php if ($success): ?>
    <div class="alert alert-success alert-dismissible fade show"><?= htmlspecialchars($success) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>
<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show"><?= htmlspecialchars($error) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>

<h4 class="mb-4">Communication</h4>

<ul class="nav nav-tabs mb-3" id="commTabs" role="tablist">
    <li class="nav-item"><button class="nav-link active" id="send-tab" data-bs-toggle="tab" data-bs-target="#send" type="button" role="tab">Send Message</button></li>
    <li class="nav-item"><button class="nav-link" id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button" role="tab">History</button></li>
    <li class="nav-item"><button class="nav-link" id="ann-tab" data-bs-toggle="tab" data-bs-target="#announcements" type="button" role="tab">Announcements</button></li>
</ul>

<div class="tab-content">
    <div class="tab-pane fade show active" id="send" role="tabpanel">
        <div class="card shadow-sm">
            <div class="card-body">
                <form method="POST" action="api/communication.php">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Channel</label>
                            <select name="type" class="form-select" required>
                                <option value="SMS">SMS</option>
                                <option value="WHATSAPP">WhatsApp</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Member (optional)</label>
                            <select name="member_id" class="form-select">
                                <option value="">-- Manual entry --</option>
                                <?php foreach ($membersList as $m): ?>
                                    <option value="<?= $m['id'] ?>"><?= htmlspecialchars($m['first_name'] . ' ' . $m['last_name']) ?> (<?= htmlspecialchars($m['phone']) ?>)</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Recipient Phone</label>
                            <input type="text" name="recipient" class="form-control" placeholder="+2348012345678">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Subject</label>
                            <input type="text" name="subject" class="form-control">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Message</label>
                            <textarea name="message" class="form-control" rows="4" required></textarea>
                        </div>
                        <div class="col-12">
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="tab-pane fade" id="history" role="tabpanel">
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr><th>Type</th><th>Recipient</th><th>Member</th><th>Message</th><th>Status</th><th>Sent At</th></tr>
                        </thead>
                        <tbody>
                            <?php if (count($communications) === 0): ?>
                                <tr><td colspan="6" class="text-center text-muted py-4">No messages sent yet.</td></tr>
                            <?php endif; ?>
                            <?php foreach ($communications as $c): ?>
                                <tr>
                                    <td><span class="badge bg-info"><?= htmlspecialchars($c['type']) ?></span></td>
                                    <td><?= htmlspecialchars($c['recipient']) ?></td>
                                    <td><?= $c['member_id'] ? htmlspecialchars($c['first_name'] . ' ' . $c['last_name']) : '-' ?></td>
                                    <td><?= htmlspecialchars(mb_substr($c['message'], 0, 60)) ?><?= mb_strlen($c['message']) > 60 ? '...' : '' ?></td>
                                    <td><span class="badge bg-<?= $c['status'] === 'SENT' ? 'success' : 'danger' ?>"><?= $c['status'] ?></span></td>
                                    <td><?= $c['created_at'] ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="tab-pane fade" id="announcements" role="tabpanel">
        <div class="mb-3">
            <button class="btn btn-primary" onclick="document.getElementById('annForm').style.display=document.getElementById('annForm').style.display=='none'?'block':'none'">+ New Announcement</button>
        </div>
        <div id="annForm" style="display:none;" class="mb-4">
            <div class="card shadow-sm">
                <div class="card-body">
                    <form method="POST" action="api/communication.php">
                        <input type="hidden" name="action" value="announcement">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Title</label>
                                <input type="text" name="title" class="form-control" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Priority</label>
                                <select name="priority" class="form-select">
                                    <option value="NORMAL">Normal</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Content</label>
                                <textarea name="content" class="form-control" rows="4" required></textarea>
                            </div>
                            <div class="col-12">
                                <button type="submit" class="btn btn-success">Post Announcement</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        <div class="row g-3">
            <?php foreach ($announcements as $a): 
                $prioClass = $a['priority'] === 'URGENT' ? 'bg-danger' : ($a['priority'] === 'HIGH' ? 'bg-warning text-dark' : 'bg-secondary');
            ?>
                <div class="col-md-6">
                    <div class="card shadow-sm h-100">
                        <div class="card-body">
                            <h5 class="card-title"><?= htmlspecialchars($a['title']) ?></h5>
                            <span class="badge <?= $prioClass ?> mb-2"><?= htmlspecialchars($a['priority']) ?></span>
                            <p class="card-text"><?= nl2br(htmlspecialchars($a['content'])) ?></p>
                            <small class="text-muted"><?= htmlspecialchars($a['first_name'] . ' ' . $a['last_name']) ?> &middot; <?= $a['created_at'] ?></small>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
            <?php if (count($announcements) === 0): ?>
                <div class="col-12"><p class="text-muted text-center">No announcements yet.</p></div>
            <?php endif; ?>
        </div>
    </div>
</div>