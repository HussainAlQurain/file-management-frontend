import { Injectable, inject, signal, WritableSignal, computed, Signal } from '@angular/core';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { UserService } from '../services/user.service';
import { User, ChangePasswordRequest } from '../models/auth.model';
import { Page } from '../models/document.model'; // Assuming Page model is generic enough
import { SnackbarService } from '../services/snackbar.service';

export interface UserStoreState {
  usersPage: Page<User> | null;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserStoreState = {
  usersPage: null,
  currentUser: null,
  isLoading: false,
  error: null,
};

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private userService = inject(UserService);
  private snackbar = inject(SnackbarService);

  private state: WritableSignal<UserStoreState> = signal(initialState);

  // Selectors (public signals)
  usersPage: Signal<Page<User> | null> = computed(() => this.state().usersPage);
  currentUser: Signal<User | null> = computed(() => this.state().currentUser);
  isLoading: Signal<boolean> = computed(() => this.state().isLoading);
  error: Signal<string | null> = computed(() => this.state().error);
  
  // Calculated total users for pagination convenience
  totalUsers: Signal<number> = computed(() => this.state().usersPage?.totalElements ?? 0);

  constructor() {}

  // Actions
  loadUsers(query?: any): Observable<Page<User>> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.list(query).pipe(
      tap(usersPage => {
        this.state.update(s => ({ ...s, usersPage, isLoading: false }));
      }),
      catchError(err => {
        const errorMsg = 'Failed to load users: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  loadUserById(id: number): Observable<User> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.get(id).pipe(
      tap(user => {
        this.state.update(s => ({ ...s, currentUser: user, isLoading: false }));
      }),
      catchError(err => {
        const errorMsg = 'Failed to load user: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  createUser(user: Partial<User>): Observable<User> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.create(user).pipe(
      tap(newUser => {
        this.state.update(s => ({
          ...s,
          isLoading: false,
          // Optionally update usersPage if it makes sense for the UX
        }));
        this.snackbar.success('User created successfully.');
      }),
      catchError(err => {
        const errorMsg = 'Failed to create user: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.update(id, user).pipe(
      tap(updatedUser => {
        this.state.update(s => ({
          ...s,
          currentUser: s.currentUser?.id === id ? updatedUser : s.currentUser,
          usersPage: s.usersPage ? {
            ...s.usersPage,
            content: s.usersPage.content.map(u => u.id === id ? updatedUser : u)
          } : null,
          isLoading: false
        }));
        this.snackbar.success('User updated successfully.');
      }),
      catchError(err => {
        const errorMsg = 'Failed to update user: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.delete(id).pipe(
      tap(() => {
        this.state.update(s => ({
          ...s,
          usersPage: s.usersPage ? {
            ...s.usersPage,
            content: s.usersPage.content.filter(u => u.id !== id),
            totalElements: s.usersPage.totalElements -1
          } : null,
          isLoading: false
        }));
        this.snackbar.success('User deleted successfully.');
      }),
      catchError(err => {
        const errorMsg = 'Failed to delete user: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  changePassword(id: number, request: ChangePasswordRequest): Observable<void> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.changePassword(id, request).pipe(
      tap(() => {
        this.state.update(s => ({ ...s, isLoading: false }));
        this.snackbar.success('Password changed successfully.');
      }),
      catchError(err => {
        const errorMsg = 'Failed to change password: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }
  
  resetPassword(id: number): Observable<void> {
    this.state.update(s => ({ ...s, isLoading: true, error: null }));
    return this.userService.resetPassword(id).pipe(
      tap(() => {
        this.state.update(s => ({ ...s, isLoading: false }));
        this.snackbar.success('Password reset successfully. New password sent to user.');
      }),
      catchError(err => {
        const errorMsg = 'Failed to reset password: ' + (err.error?.message || err.message);
        this.state.update(s => ({ ...s, isLoading: false, error: errorMsg }));
        this.snackbar.error(errorMsg);
        return throwError(() => err);
      })
    );
  }

  // Utility to clear current user, e.g., on navigating away from a detail page
  clearCurrentUser(): void {
    this.state.update(s => ({ ...s, currentUser: null }));
  }
}
