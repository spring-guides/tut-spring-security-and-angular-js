import { HttpInterceptorFn } from '@angular/common/http';

export const xhrInterceptor: HttpInterceptorFn = (req, next) => {
  const xhr = req.clone({
    headers: req.headers.set('X-Requested-With', 'XMLHttpRequest')
  });
  return next(xhr);
};
