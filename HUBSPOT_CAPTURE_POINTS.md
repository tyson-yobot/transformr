# TRANSFORMR → HubSpot Contact Capture Points

Every user interaction that generates contact data flows to HubSpot
through Supabase database triggers → hubspot-sync Edge Function.

---

## Automatic Capture (via database triggers — live today)

| Touchpoint | DB Table | Event | HubSpot Properties Updated |
|---|---|---|---|
| User signs up (any provider) | profiles | INSERT | email, firstname, lastname, transformr_user_id, transformr_tier, transformr_onboarding_complete |
| Profile edited (name, DOB, goals, weight) | profiles | UPDATE | firstname, lastname, transformr_goal_direction, transformr_current_weight, transformr_target_weight, transformr_date_of_birth |
| Onboarding completed | profiles | UPDATE | transformr_onboarding_complete = true |
| Goal direction changed | profiles | UPDATE | transformr_goal_direction |
| Subscription purchased | subscriptions | INSERT | transformr_tier, transformr_subscription_status |
| Subscription upgraded / downgraded | subscriptions | UPDATE (tier) | transformr_tier |
| Subscription cancelled / past due | subscriptions | UPDATE (status) | transformr_subscription_status |
| Weight logged | weight_logs | INSERT | transformr_current_weight, transformr_last_active |

---

## Property Mapping — profiles table

| Supabase Column | HubSpot Property | Notes |
|---|---|---|
| email | email | Primary identifier |
| display_name | firstname + lastname | Split on first space |
| id | transformr_user_id | UUID |
| subscription_tier | transformr_tier | free / pro / elite / partners |
| onboarding_completed | transformr_onboarding_complete | true / false string |
| goal_direction | transformr_goal_direction | gain / lose / maintain |
| current_weight | transformr_current_weight | lbs, numeric |
| goal_weight | transformr_target_weight | lbs, numeric |
| date_of_birth | transformr_date_of_birth | ISO date string |

---

## Manual / Future Capture Points

| Touchpoint | What's Needed |
|---|---|
| Account deletion | Add profiles DELETE trigger → set a `transformr_churned` property or lifecycle stage = "Other" |
| Support form submission | Zendesk → HubSpot integration, or add support_tickets table trigger |
| Referral invite sent | Add partner_invites table trigger to hubspot-sync |
| Landing page visit / opt-in | Add HubSpot tracking script + form embed to transformr.app |
| App Store review response | Manual — add note to HubSpot contact |
| Push notification opt-in / opt-out | Add expo_push_token change detection to profiles trigger |

---

## HubSpot Lists to Create (for segmentation)

| List Name | Filter |
|---|---|
| All TRANSFORMR Users | transformr_user_id is known |
| Free Tier | transformr_tier = free |
| Pro | transformr_tier = pro |
| Elite | transformr_tier = elite |
| Partners | transformr_tier = partners |
| Paid (any) | transformr_tier in (pro, elite, partners) |
| Onboarding Incomplete | transformr_onboarding_complete = false AND create date < 48h ago |
| Active This Week | transformr_last_active within last 7 days |
| At-Risk (14 days inactive) | transformr_last_active > 14 days ago AND tier = paid |
| Churned (30 days inactive) | transformr_last_active > 30 days ago |
| Losing Weight | transformr_goal_direction = lose |
| Building Muscle | transformr_goal_direction = gain |

---

## HubSpot Workflows to Create (automated outreach)

| Workflow | Trigger | Action |
|---|---|---|
| Welcome sequence | Contact created with transformr_user_id | Send 3-part welcome email series |
| Onboarding nudge | transformr_onboarding_complete = false, 24h after signup | Send "finish setup" email |
| Onboarding nudge 2 | transformr_onboarding_complete = false, 72h after signup | Send second nudge |
| Upgrade prompt | Free tier + active 14+ days | Send upgrade email with social proof |
| Churn prevention | Paid tier + 7 days inactive | Send re-engagement email |
| Win-back | Tier changed from paid → free | Send win-back offer (30-day delay) |
| Cancellation survey | transformr_subscription_status = canceled | Send 1-question "why did you leave" email |
| Goal milestone (60 days) | Contact age > 60 days AND transformr_onboarding_complete = true | Send progress check-in |
