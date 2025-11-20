# ✅ PT Exercises - Deployment Checklist

Use this checklist to ensure everything is properly deployed.

---

## 📋 Pre-Deployment

### Database Setup
- [ ] Opened Supabase Dashboard
- [ ] Navigated to SQL Editor
- [ ] Ran `scripts/setup-pt-exercises.sql`
- [ ] Saw success messages in output
- [ ] Verified tables exist:
  - [ ] `pt_exercise_programs`
  - [ ] `pt_exercises`
  - [ ] `pt_exercise_completions`
  - [ ] `pt_weekly_goals`

### Environment Variables
- [ ] Verified `.env.local` exists
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Values are correct (from Supabase settings)

### Code Files
- [ ] All files committed to git
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build succeeds (`npm run build`)

---

## 🧪 Testing Checklist

### Staff Interface Tests
- [ ] Can access `/pt-management`
- [ ] Patient dropdown loads
- [ ] Can create new program
- [ ] Can add multiple exercises
- [ ] Can set difficulty levels
- [ ] Can submit program successfully
- [ ] Program appears in list
- [ ] Progress bars display correctly
- [ ] Status badges show correctly

### Patient Interface Tests
- [ ] Can access `/patient-portal`
- [ ] PT Exercises tab visible
- [ ] Loading state shows while fetching
- [ ] Program details display correctly
- [ ] Exercise cards render properly
- [ ] "Mark Complete" button works
- [ ] Exercise turns green when completed
- [ ] Progress updates automatically
- [ ] Weekly goals checkboxes work
- [ ] Timer starts/stops/resets correctly

### API Tests
- [ ] GET `/api/patient-portal/exercises` returns data
- [ ] POST `/api/patient-portal/exercises` marks complete
- [ ] PATCH `/api/patient-portal/exercises/goals` toggles goals
- [ ] GET `/api/staff/pt-exercises` returns programs
- [ ] POST `/api/staff/pt-exercises` creates program
- [ ] All API errors are handled gracefully

### Edge Cases
- [ ] Patient with no program shows empty state
- [ ] Empty exercises list handled
- [ ] Network errors show toast notification
- [ ] Invalid patient ID handled
- [ ] Missing environment variables caught
- [ ] Database connection failures handled

---

## 🔒 Security Verification

### Database Security
- [ ] RLS enabled on all 4 tables
- [ ] Service role policies created
- [ ] Authenticated user policies created
- [ ] No public access without auth
- [ ] Foreign keys enforced

### API Security
- [ ] Environment variables validated
- [ ] Supabase client uses service role
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive data
- [ ] SQL injection prevented (using parameterized queries)

### Frontend Security
- [ ] No sensitive data in localStorage
- [ ] API calls use HTTPS
- [ ] User input sanitized
- [ ] XSS protection active (React default)
- [ ] CSRF protection active (Next.js default)

---

## 📱 UI/UX Verification

### Responsive Design
- [ ] Mobile (320px-768px) works
- [ ] Tablet (768px-1024px) works
- [ ] Desktop (1024px+) works
- [ ] Touch targets large enough on mobile
- [ ] Text readable on all screen sizes

### User Experience
- [ ] Loading states show while fetching
- [ ] Empty states show when no data
- [ ] Success toasts on actions
- [ ] Error toasts on failures
- [ ] Smooth transitions
- [ ] No layout shifts
- [ ] Buttons have clear labels
- [ ] Forms validate input

### Accessibility
- [ ] Buttons are keyboard accessible
- [ ] Forms can be tabbed through
- [ ] Color contrast sufficient
- [ ] Error messages clear
- [ ] Loading indicators visible

---

## 📊 Performance Checks

### Database
- [ ] Indexes created on foreign keys
- [ ] Queries optimized
- [ ] No N+1 query problems
- [ ] Proper use of `.single()` vs array

### API
- [ ] Response times under 500ms
- [ ] No unnecessary data fetched
- [ ] Proper error handling
- [ ] Logging enabled

### Frontend
- [ ] Page load under 3 seconds
- [ ] No unnecessary re-renders
- [ ] Images optimized (if any)
- [ ] Minimal bundle size

---

## 🚀 Deployment Steps

### Development
- [ ] Run `npm run dev`
- [ ] Test all features manually
- [ ] Check browser console for errors
- [ ] Check server logs for errors

### Staging (if applicable)
- [ ] Deploy to staging environment
- [ ] Run database migrations
- [ ] Test with staging data
- [ ] Get stakeholder approval

### Production
- [ ] Deploy to production
- [ ] Run database migrations
- [ ] Verify environment variables
- [ ] Test critical user flows
- [ ] Monitor for errors
- [ ] Announce to users

---

## 📝 Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor API response times
- [ ] Track user adoption
- [ ] Watch for database issues
- [ ] Check server logs regularly

### Documentation
- [ ] Update internal wiki
- [ ] Train staff on new features
- [ ] Create user guides
- [ ] Document common issues
- [ ] Share with team

### User Feedback
- [ ] Collect patient feedback
- [ ] Collect PT staff feedback
- [ ] Create feedback mechanism
- [ ] Plan iteration based on feedback

---

## 🐛 Known Issues (Document here)

_None currently - add any issues discovered during testing_

---

## 📞 Support Plan

### Support Contacts
- **Database Issues:** [Supabase Dashboard]
- **API Issues:** [Check server logs]
- **UI Issues:** [Browser console]

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No program showing | Create program in PT management |
| API errors | Check environment variables |
| Database errors | Re-run setup script |
| Loading forever | Check network tab for failed requests |

---

## ✅ Final Sign-Off

### Review Completed By:
- [ ] Developer: _________________ Date: _______
- [ ] QA Tester: _________________ Date: _______
- [ ] Product Owner: _____________ Date: _______
- [ ] Clinical Staff: _____________ Date: _______

### Deployment Approved By:
- [ ] Technical Lead: _____________ Date: _______
- [ ] Product Manager: ___________ Date: _______

---

## 🎉 Launch Readiness

Once all items are checked:

✅ **Ready to Launch!**

**Next Steps:**
1. Deploy to production
2. Announce to users
3. Monitor closely for 24 hours
4. Collect feedback
5. Iterate and improve

---

**Good luck with your launch! 🚀**

