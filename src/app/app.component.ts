import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoaderComponent } from './shared/components/loader/loader.component';
import { VisitorTrackingService } from './core/services/visitor-tracking.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, LoaderComponent],
  template: `
    <router-outlet />
    <app-toast />
    <app-loader />
  `,
})
export class AppComponent implements OnInit, OnDestroy {

  private readonly tracking = inject(VisitorTrackingService);
  private readonly router   = inject(Router);

  /** Abonnement aux événements de navigation pour le tracking des pages SPA */
  private routerSub?: Subscription;

  ngOnInit(): void {
    // Initialise le tracking : premier pageview + heartbeat + beforeunload
    this.tracking.init();

    // Tracker chaque navigation côté SPA (Angular Router)
    // On ignore le premier événement car init() l'a déjà pris en charge.
    let firstNav = true;
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        if (firstNav) {
          firstNav = false;
          return;
        }
        this.tracking.trackPageView((e as NavigationEnd).urlAfterRedirects);
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }
}
