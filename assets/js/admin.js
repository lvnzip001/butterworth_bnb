import { initBookings } from './admin-bookings.js';
import { initCheckin } from './checkin.js';
import { initCustomerManagement } from './customers.js';
import { initPricing } from './pricing.js';
import { initStats } from './stats.js';
import supabase from './supabase-client.js';

(async () => {
  const token = localStorage.getItem('supabase.auth.token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    localStorage.removeItem('supabase.auth.token');
    window.location.href = 'login.html';
    return;
  }

  // Check if the user is approved in the admins table
  const { data: adminData, error: adminError } = await supabase
    .from('admins')
    .select('approved')
    .eq('id', user.id)
    .single();

  if (adminError || !adminData || !adminData.approved) {
    localStorage.removeItem('supabase.auth.token');
    window.location.href = 'login.html?message=account_not_approved';
    return;
  }

  console.log('User authenticated and approved:', user.email);
  // ... (rest of your admin.js logic here)
})();

(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim();
    if (all) {
      return [...document.querySelectorAll(el)];
    } else {
      return document.querySelector(el);
    }
  };

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    if (all) {
      select(el, all).forEach(e => e.addEventListener(type, listener));
    } else {
      select(el, all).addEventListener(type, listener);
    }
  };

  /**
   * Easy on scroll event listener
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener);
  };

  /**
   * Sidebar toggle
   */
  if (select('.toggle-sidebar-btn')) {
    on('click', '.toggle-sidebar-btn', function(e) {
      select('body').classList.toggle('toggle-sidebar');
    });
  }

  /**
   * Search bar toggle
   */
  if (select('.search-bar-toggle')) {
    on('click', '.search-bar-toggle', function(e) {
      select('.search-bar').classList.toggle('search-bar-show');
    });
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true);
  const navbarlinksActive = () => {
    let position = window.scrollY + 200;
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return;
      let section = select(navbarlink.hash);
      if (!section) return;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active');
      } else {
        navbarlink.classList.remove('active');
      }
    });
  };
  window.addEventListener('load', navbarlinksActive);
  onscroll(document, navbarlinksActive);

  /**
   * Toggle .header-scrolled class to #header when page is scrolled
   */
  let selectHeader = select('#header');
  if (selectHeader) {
    const headerScrolled = () => {
      if (window.scrollY > 100) {
        selectHeader.classList.add('header-scrolled');
      } else {
        selectHeader.classList.remove('header-scrolled');
      }
    };
    window.addEventListener('load', headerScrolled);
    onscroll(document, headerScrolled);
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top');
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active');
      } else {
        backtotop.classList.remove('active');
      }
    };
    window.addEventListener('load', toggleBacktotop);
    onscroll(document, toggleBacktotop);
  }

  /**
   * Initiate tooltips
   */
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  /**
   * Initiate Bootstrap validation check
   */
  var needsValidation = document.querySelectorAll('.needs-validation');
  Array.prototype.slice.call(needsValidation).forEach(function(form) {
    form.addEventListener('submit', function(event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    }, false);
  });

  /**
   * Initiate Datatables
   */
  const datatables = select('.datatable', true);
  datatables.forEach(datatable => {
    new simpleDatatables.DataTable(datatable, {
      perPageSelect: [5, 10, 15, ["All", -1]],
      columns: [
        { select: 2, sortSequence: ["desc", "asc"] },
        { select: 3, sortSequence: ["desc"] },
        { select: 4, cellClass: "green", headerClass: "red" }
      ]
    });
  });

  /**
   * Initialize all dashboard modules
   */
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await Promise.all([
        initBookings(),
        initCheckin(),
        initCustomerManagement(),
        initPricing(),
        initStats()
      ]);
    } catch (error) {
      console.error('Error initializing dashboard:', error);
      alert('Failed to initialize dashboard. Please refresh.');
    }
  });
})();