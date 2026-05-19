import { ChangeEvent, FormEvent, useState } from 'react';

type ContactFormValues = {
  fullName: string;
  email: string;
  message: string;
};

type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

// Hook quản lý form liên hệ trên trang landing.
export const useLandingPage = () => {
  const [formValues, setFormValues] = useState<ContactFormValues>({
    fullName: '',
    email: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<ContactFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Kiểm tra hợp lệ dữ liệu form liên hệ.
  const validateContactForm = (values: ContactFormValues): ContactFormErrors => {
    const errors: ContactFormErrors = {};

    if (!values.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
    }

    if (!values.email.trim()) {
      errors.email = 'Vui lòng nhập email.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        errors.email = 'Email không đúng định dạng.';
      }
    }

    if (!values.message.trim()) {
      errors.message = 'Vui lòng nhập nội dung góp ý.';
    }

    return errors;
  };

  // Cập nhật giá trị input và xóa lỗi tương ứng.
  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));

    if (formErrors[name as keyof ContactFormValues]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }

    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  // Gửi form liên hệ và reset khi hợp lệ.
  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validateContactForm(formValues);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      setIsSubmitted(false);
      return;
    }

    setIsSubmitted(true);
    setFormValues({
      fullName: '',
      email: '',
      message: '',
    });
  };

  return {
    formValues,
    formErrors,
    isSubmitted,
    handleInputChange,
    handleContactSubmit,
  };
};
