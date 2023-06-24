import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItinerariesPage } from './itineraries.page';

describe('ItinerariesPage', () => {
  let component: ItinerariesPage;
  let fixture: ComponentFixture<ItinerariesPage>;

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ItinerariesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
