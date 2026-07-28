# Commercial Beta trust pages

This release adds public About, Data Policy, Privacy Policy, and Beta Terms pages. The text describes the product's current behavior only: no first-party account system, no payment system, browser-local favorites, GitHub Issue Forms for public feedback, and GitHub Pages hosting.

It also fixes the source results counter so repeated DOM simplification cannot append duplicate count labels. A regression test executes the normalization repeatedly and verifies that the count node remains stable and only one label exists.
