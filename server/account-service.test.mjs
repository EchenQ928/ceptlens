import { afterEach, beforeEach, expect, it } from 'vitest';
import { openCommunityStore } from './community-store.mjs';
import { createAccountService } from './account-service.mjs';
let store, accounts, now;
beforeEach(()=>{store=openCommunityStore(':memory:');now=1000;accounts=createAccountService(store.db,{clock:()=>now});});
afterEach(()=>store.close());
const registration={email:'owner@example.test',password:'temporary-test-password',name:'Owner'};
it('never accepts developer privileges from registration and requires a signed session',()=>{
 const result=accounts.register({...registration,role:'developer'});
 expect(result.user.role).toBe('learner');expect(accounts.canManageContent(result.cookie)).toBe(false);
 accounts.setRole(result.user.id,'developer');expect(accounts.canManageContent(result.cookie)).toBe(true);
 expect(accounts.canManageContent('ceptlens_session=forged')).toBe(false);
 expect(accounts.canManageContent(undefined)).toBe(false);
 accounts.setRole(result.user.id,'learner');expect(accounts.canManageContent(result.cookie)).toBe(false);
});
it('persists roles, revokes publishing on logout or expiration, and rejects unknown users',()=>{
 const result=accounts.register(registration); accounts.setRole(result.user.id,'developer');
 accounts=createAccountService(store.db,{clock:()=>now});expect(accounts.canManageContent(result.cookie)).toBe(true);
 const second=accounts.login(registration);accounts.logout(result.cookie);expect(accounts.canManageContent(result.cookie)).toBe(false);expect(accounts.canManageContent(second.cookie)).toBe(true);
 now+=2592000001;expect(accounts.canManageContent(second.cookie)).toBe(false);
 expect(()=>accounts.setRole('unknown','developer')).toThrow();
});
it('keeps guest upgrades unprivileged and renames the signed-in account independently of guest identity',()=>{
 const guest=store.identity('a'.repeat(48)); const result=accounts.guestToAccount(guest.id,{...registration,role:'developer'});
 expect(result.user.id).toBe(guest.id);expect(result.user.role).toBe('learner');
 accounts.setRole(guest.id,'developer'); expect(accounts.rename(result.cookie,'New name')).toMatchObject({id:guest.id,name:'New name',role:'developer'});
 expect(()=>accounts.rename(undefined,'Forged')).toThrow();
});
