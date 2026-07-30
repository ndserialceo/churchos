<div class="sidebar bg-dark text-white" id="sidebar">
        <div class="sidebar-heading text-center py-4 fs-4 fw-bold border-bottom border-secondary">
            <i class="bi bi-cross"></i> ChurchOS
        </div>
        <ul class="nav flex-column mt-3">
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'dashboard') ? ' active' : ''; ?>" href="index.php?page=dashboard">
                    <i class="bi bi-speedometer2 me-2"></i> Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'members') ? ' active' : ''; ?>" href="index.php?page=members">
                    <i class="bi bi-people me-2"></i> Members
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'finance') ? ' active' : ''; ?>" href="index.php?page=finance">
                    <i class="bi bi-cash-stack me-2"></i> Finance
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'communication') ? ' active' : ''; ?>" href="index.php?page=communication">
                    <i class="bi bi-chat-dots me-2"></i> Communication
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'followup') ? ' active' : ''; ?>" href="index.php?page=followup">
                    <i class="bi bi-person-check me-2"></i> Follow-up
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'volunteers') ? ' active' : ''; ?>" href="index.php?page=volunteers">
                    <i class="bi bi-hand-thumbs-up me-2"></i> Volunteers
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'branches') ? ' active' : ''; ?>" href="index.php?page=branches">
                    <i class="bi bi-geo-alt me-2"></i> Branches
                </a>
            </li>
        </ul>
        <div class="mt-auto border-top border-secondary p-3">
            <a href="logout.php" class="btn btn-outline-light w-100">
                <i class="bi bi-box-arrow-left me-2"></i> Logout
            </a>
        </div>
    </div>

    <!-- Offcanvas for mobile -->
    <div class="offcanvas offcanvas-start bg-dark text-white" tabindex="-1" id="offcanvasSidebar">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title text-white"><i class="bi bi-cross"></i> ChurchOS</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
        </div>
        <div class="offcanvas-body p-0">
            <ul class="nav flex-column">
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'dashboard') ? ' active' : ''; ?>" href="index.php?page=dashboard">
                        <i class="bi bi-speedometer2 me-2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'members') ? ' active' : ''; ?>" href="index.php?page=members">
                        <i class="bi bi-people me-2"></i> Members
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'finance') ? ' active' : ''; ?>" href="index.php?page=finance">
                        <i class="bi bi-cash-stack me-2"></i> Finance
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'communication') ? ' active' : ''; ?>" href="index.php?page=communication">
                        <i class="bi bi-chat-dots me-2"></i> Communication
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'followup') ? ' active' : ''; ?>" href="index.php?page=followup">
                        <i class="bi bi-person-check me-2"></i> Follow-up
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'volunteers') ? ' active' : ''; ?>" href="index.php?page=volunteers">
                        <i class="bi bi-hand-thumbs-up me-2"></i> Volunteers
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link<?php echo (isset($_GET['page']) && $_GET['page'] == 'branches') ? ' active' : ''; ?>" href="index.php?page=branches">
                        <i class="bi bi-geo-alt me-2"></i> Branches
                    </a>
                </li>
            </ul>
            <div class="border-top border-secondary p-3">
                <a href="logout.php" class="btn btn-outline-light w-100">
                    <i class="bi bi-box-arrow-left me-2"></i> Logout
                </a>
            </div>
        </div>
    </div>