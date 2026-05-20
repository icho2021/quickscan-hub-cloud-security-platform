/**
 * Test Case 3: XSS (Cross-Site Scripting)
 * Multiple XSS vulnerability examples
 */

// Example 1: Direct innerHTML Assignment
function displayComment(userComment) {
  document.getElementById('comments-section').innerHTML = userComment;
}

// Example 2: outerHTML Assignment
function renderUserProfile(html) {
  const profileDiv = document.querySelector('.profile');
  profileDiv.outerHTML = html;
}

// Example 3: insertAdjacentHTML
function addNotification(message) {
  const container = document.getElementById('notifications');
  container.insertAdjacentHTML('beforeend', message);
}

// Example 4: document.write
function writeUserData(userData) {
  document.write('<h2>' + userData.name + '</h2>');
  document.write('<p>' + userData.bio + '</p>');
}

// Example 5: Dynamic Script Creation
function executeTemplate(template, data) {
  document.writeln('<div>' + template.replace('{{data}}', data) + '</div>');
}

// React Component Example 6: dangerouslySetInnerHTML
import React from 'react';

export function UserBioDisplay({ user }) {
  return (
    <div>
      <h1>User Information</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      <p dangerouslySetInnerHTML={{ __html: user.description }} />
    </div>
  );
}

// Example 7: Indirect XSS - through event handlers
function setupEventHandler(userInput) {
  const element = document.createElement('div');
  element.innerHTML = '<img src="x" onerror="' + userInput + '">';
  document.body.appendChild(element);
}

// Example 8: Through setAttribute
function setCustomAttribute(element, value) {
  element.setAttribute('data-content', value);
  element.innerHTML = '<span>' + element.getAttribute('data-content') + '</span>';
}
