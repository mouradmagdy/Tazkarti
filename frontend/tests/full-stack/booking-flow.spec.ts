import { expect, request, test, type APIRequestContext, type APIResponse } from '@playwright/test';

const API_URL = process.env.E2E_API_URL;
const USER_PASSWORD = 'Password123!';

type EventSummary = {
  id: string;
  name: string;
  availableSeats: number;
  venueId?: string | null;
};

type EventsResponse = {
  events: EventSummary[];
  totalEvents: number;
};

type SeatMapSeat = {
  eventSeatId: string;
  label: string;
  price: number;
  status: 'available' | 'held' | 'sold';
};

type SeatMapResponse = {
  sections: Array<{
    name: string;
    seats: SeatMapSeat[];
  }>;
};

test.describe('real backend booking flow', () => {
  test.skip(!API_URL, 'Set E2E_API_URL to run full-stack backend tests.');

  test('locks and confirms two different seats for the same user', async () => {
    const anonymousApi = await request.newContext({ baseURL: API_URL });
    const username = `e2e${Date.now()}${Math.random().toString(36).slice(2, 8)}`;

    const signupResponse = await anonymousApi.post('/api/auth/signup', {
      data: {
        fullName: 'E2E Booking User',
        username,
        password: USER_PASSWORD,
        confirmPassword: USER_PASSWORD,
        gender: 'male',
      },
    });

    expect(signupResponse.status()).toBe(201);

    const authCookie = extractJwtCookie(signupResponse);
    const api = await request.newContext({
      baseURL: API_URL,
      extraHTTPHeaders: {
        Cookie: authCookie,
      },
    });

    const event = await getBookableEvent(api);
    const firstTwoSeats = await getAvailableSeats(api, event.id, 2);

    const firstBooking = await bookSeat(api, event.id, firstTwoSeats[0].eventSeatId);
    expect(firstBooking.status).toBe('confirmed');
    expect(firstBooking.seats).toHaveLength(1);

    const seatMapAfterFirstBooking = await getSeatMap(api, event.id);
    const firstSeatAfterBooking = flattenSeats(seatMapAfterFirstBooking).find(
      (seat) => seat.eventSeatId === firstTwoSeats[0].eventSeatId,
    );
    expect(firstSeatAfterBooking?.status).toBe('sold');

    const secondBooking = await bookSeat(api, event.id, firstTwoSeats[1].eventSeatId);
    expect(secondBooking.status).toBe('confirmed');
    expect(secondBooking.bookingId).not.toBe(firstBooking.bookingId);

    const eventAfterBookings = await getEvent(api, event.id);
    expect(eventAfterBookings.availableSeats).toBe(event.availableSeats - 2);

    await anonymousApi.dispose();
    await api.dispose();
  });
});

async function getBookableEvent(api: APIRequestContext) {
  const response = await api.get('/api/events/getAllEvents', {
    params: {
      pageNumber: 1,
      pageSize: 10,
    },
  });

  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as EventsResponse;
  const event = body.events.find((item) => item.venueId && item.availableSeats >= 2);

  expect(event, 'expected seeded demo data to contain an assigned-seat event').toBeTruthy();
  return event!;
}

async function getEvent(api: APIRequestContext, eventId: string) {
  const response = await api.get(`/api/events/getEventById/${eventId}`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as EventSummary;
}

async function getSeatMap(api: APIRequestContext, eventId: string) {
  const response = await api.get(`/api/events/${eventId}/seat-map`);
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as SeatMapResponse;
}

async function getAvailableSeats(
  api: APIRequestContext,
  eventId: string,
  requiredCount: number,
) {
  const seatMap = await getSeatMap(api, eventId);
  const seats = flattenSeats(seatMap).filter((seat) => seat.status === 'available');

  expect(seats.length).toBeGreaterThanOrEqual(requiredCount);
  return seats.slice(0, requiredCount);
}

async function bookSeat(api: APIRequestContext, eventId: string, eventSeatId: string) {
  const lockResponse = await api.post('/api/bookings/lock-seats', {
    data: {
      eventId,
      eventSeatIds: [eventSeatId],
    },
  });

  expect(lockResponse.ok()).toBeTruthy();

  const confirmResponse = await api.post('/api/bookings/confirm-seats', {
    data: {
      eventId,
      eventSeatIds: [eventSeatId],
    },
  });

  expect(confirmResponse.status()).toBe(201);
  return (await confirmResponse.json()) as {
    bookingId: string;
    status: string;
    seats: unknown[];
  };
}

function flattenSeats(seatMap: SeatMapResponse) {
  return seatMap.sections.flatMap((section) => section.seats);
}

function extractJwtCookie(response: APIResponse) {
  const setCookie = response.headers()['set-cookie'];
  const jwtCookie = setCookie?.match(/jwt=[^;]+/)?.[0];

  expect(jwtCookie, 'expected signup to return a JWT cookie').toBeTruthy();
  return jwtCookie!;
}
